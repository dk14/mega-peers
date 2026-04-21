"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remoteApi = exports.startP2P = exports.connectionPool = exports.p2pNode = exports.serverPeerAPI = void 0;
const nd = __importStar(require("./api"));
const net = __importStar(require("net"));
const p2pn = __importStar(require("p2p-node"));
const node_fetch_1 = __importDefault(require("node-fetch"));
exports.serverPeerAPI = {
    createPeer: async (server, port, socket) => {
        return new p2pn.Peer(server, port);
    },
    createServer: (cfg, discovered) => {
        const server = net.createServer(function (socket) {
            console.log("Inbound connection established: " + socket.remoteAddress + ":" + socket.remotePort);
            discovered({ server: socket.remoteAddress, port: socket.remotePort, seqNo: 0 }, socket);
        });
        server.listen(cfg.p2pPort, cfg.hostname);
    }
};
exports.p2pNode = undefined;
exports.connectionPool = undefined;
const startP2P = async (cfg, peerApi = exports.serverPeerAPI) => {
    process.on('uncaughtException', function (err) {
        console.log(err);
    });
    var peersAnnounced = 0;
    var connections = 0;
    const onmessage = (ev) => {
        try {
            node.processApiRequest(ev.command, ev.data.toString('utf8'));
        }
        catch (err) {
            console.error(err);
        }
    };
    const onconnect = (addr, s) => (ev) => {
        if (!isPeerConnected(addr)) {
            connections++;
            const p = { peer: ev.peer, addr };
            console.log("[connected] Await messages from: " + p.addr.server + ":" + p.addr.port);
            ev.peer.on('message', onmessage);
            ev.peer.on('end', ondisconnect);
            peers.push(p);
            if (s === undefined) { //outbound
                broadcastPeer(addr);
            }
        }
        else {
            console.log("Drop duplicate connection..." + addr.server + ":" + addr.port);
            ev.peer.disconnect();
            ondisconnect(ev);
        }
    };
    const peers = [];
    const ondisconnect = (ev) => {
        connections--;
        const index = peers.findIndex((x => ev.peer.server === x.peer.server && ev.peer.port === x.peer.port));
        if (index > -1) {
            peers.splice(index, 1);
        }
    };
    cfg.p2pseed.forEach(x => {
        if (!peers.find(y => y.addr.server === x.server && y.addr.port === x.port)) {
            discovered(x);
        }
    });
    setInterval(() => {
        cfg.p2pseed.forEach(x => {
            if (!peers.find(y => y.addr.server === x.server && y.addr.port === x.port)) {
                discovered(x);
            }
        });
    }, cfg.p2pKeepAlive ? cfg.p2pKeepAlive * 10 : 5000);
    function isPeerDuplicate(addr) {
        const found = peers.findIndex(x => addr.server === x.addr.server && addr.port === x.addr.port);
        if (found > -1) {
            if ((peers[found].addr.seqNo ?? -1) < (addr.seqNo ?? 0)) {
                peers[found].addr.seqNo = addr.seqNo ?? 0;
                return false;
            }
            return true;
        }
        else {
            return false;
        }
    }
    function isPeerConnected(addr) {
        const found = peers.findIndex(x => addr.server === x.addr.server && addr.port === x.addr.port);
        if (found > -1) {
            return true;
        }
        else {
            return false;
        }
    }
    function broadcastPeer(peer) {
        peersAnnounced++;
        if (peersAnnounced > (cfg.peerAnnouncementQuota ?? 10))
            return;
        console.log("Announce: " + peer.server + ":" + peer.port);
        console.log("peers: " + JSON.stringify(peers.map(p => p.addr)));
        peers.forEach(p => {
            if (p.addr.server === peer.server && p.addr.port === peer.port) {
            }
            else {
                console.log("[send][peer]" + JSON.stringify(peer) + "  ==> " + JSON.stringify(p.addr));
                p.peer.send('peer', Buffer.from(JSON.stringify(peer), 'utf8'));
            }
        });
    }
    async function discovered(addr, socket) {
        if (isPeerDuplicate(addr)) {
            console.log("[ignore duplicate peer]" + JSON.stringify(addr));
            return;
        }
        if (connections > cfg.maxConnections) {
            console.log("[max connections]" + JSON.stringify(addr));
            return;
        }
        try {
            if (isPeerConnected(addr)) {
                broadcastPeer(addr);
            }
            else {
                const p = await peerApi.createPeer(addr.server, addr.port, socket);
                if (socket === undefined) {
                    console.log("Attempting outbound connection..." + addr.server + ":" + addr.port);
                    try {
                        p.connect(socket);
                    }
                    catch {
                        return;
                    }
                    p.on('connect', onconnect(addr, socket));
                }
                else {
                    console.log("Accepting inbound connection..." + addr.server + ":" + addr.port);
                    p.connect(socket);
                    onconnect(addr, socket)({ peer: p });
                }
                p.on('end', ondisconnect);
                if (cfg.hostname !== undefined) {
                    broadcastPeer({ server: cfg.hostname, port: cfg.p2pPort, seqNo: (cfg.hostSeqNo ?? 0) + seqNo, httpPort: cfg.httpPort });
                }
            }
        }
        catch (err) {
            console.error(err);
        }
    }
    function reduceCTTL(content) {
        const msg = JSON.parse(content);
        if (msg.cTTL > (cfg.ttlThreshold ?? 3)) {
            return [JSON.stringify(msg), false];
        }
        if (msg.cTTL <= 0) {
            return [JSON.stringify(msg), false];
        }
        else {
            msg.cTTL--;
            return [JSON.stringify(msg), true];
        }
    }
    async function processApiRequest(command, content) {
        console.log("[receive][cmd: " + command + "] " + content);
        if (content.length > cfg.maxMsgLength) {
            throw "Content too large";
        }
        switch (command) {
            case 'peer': {
                const peer = JSON.parse(content);
                if (peer.server === cfg.hostname && peer.port === cfg.p2pPort) {
                    //console.log("[ignore turnaround]" + peer.server + ":" + peer.port)
                }
                else {
                    await discovered(peer);
                }
                break;
            }
            case 'oracle': {
                const result = await nd.api.announceOracle(cfg, JSON.parse(content));
                if (result == 'success') {
                    broadcastMessage(command, content);
                }
                else if (result == 'duplicate') {
                    const [adjusted, toBroadcast] = reduceCTTL(content);
                    if (toBroadcast) {
                        broadcastMessage(command, adjusted);
                    }
                }
                break;
            }
            case 'capability': {
                const result = await nd.api.announceCapability(cfg, JSON.parse(content));
                if (result == 'success') {
                    broadcastMessage(command, content);
                }
                else if (result == 'duplicate') {
                    const [adjusted, toBroadcast] = reduceCTTL(content);
                    if (toBroadcast) {
                        broadcastMessage(command, adjusted);
                    }
                }
                break;
            }
            case 'report': {
                const result = await nd.api.reportMalleability(cfg, JSON.parse(content));
                if (result == 'success') {
                    broadcastMessage(command, content);
                }
                else if (result == 'duplicate') {
                    const [adjusted, toBroadcast] = reduceCTTL(content);
                    if (toBroadcast) {
                        broadcastMessage(command, adjusted);
                    }
                    else {
                        console.log("[report]ignore duplicate");
                    }
                }
                else {
                    console.log("[report]ignore duplicate");
                }
                break;
            }
            case 'dispute': {
                const result = await nd.api.disputeMissingfactClaim(JSON.parse(content));
                if (result == 'success') {
                    broadcastMessage(command, content);
                }
                else if (result == 'duplicate' || result == "report not found") {
                    const [adjusted, toBroadcast] = reduceCTTL(content);
                    if (toBroadcast) {
                        broadcastMessage(command, adjusted);
                    }
                }
                break;
            }
            case 'offer': {
                const result = await nd.api.publishOffer(cfg, JSON.parse(content));
                console.log(result + " " + JSON.parse(content).pow.hash);
                if (result == 'success') {
                    broadcastMessage(command, content);
                }
                else if (result == 'duplicate') {
                    const [adjusted, toBroadcast] = reduceCTTL(content);
                    if (toBroadcast) {
                        broadcastMessage(command, adjusted);
                    }
                }
                break;
            }
        }
    }
    function broadcastMessage(command, content) {
        peers.forEach(p => {
            console.log("[send][cmd: " + command + "] " + content + " ===> " + JSON.stringify(p.addr));
            p.peer.send(command, Buffer.from(content, 'utf8'));
        });
    }
    const node = {
        peers, discovered, broadcastPeer, processApiRequest, broadcastMessage
    };
    peerApi.createServer(cfg, discovered);
    exports.p2pNode = node;
    exports.connectionPool = {
        list: function (cfg) {
            return peers.map(x => x.addr);
        },
        getapi: function (peer) {
            const prefix = `http://${peer.server}:${peer.httpPort ?? 8080}/`;
            return (0, exports.remoteApi)(prefix);
        },
        drop: function (cfg, peer) {
            const neighbor = peers.find(x => x.addr.server === peer.server && x.addr.port === peer.port);
            if (neighbor) {
                neighbor.peer.disconnect();
            }
        }
    };
    setInterval(() => {
        peersAnnounced = 0;
    }, 1000);
    if (cfg.hostname !== undefined) {
        var seqNo = 0;
        const peerAd = () => {
            seqNo++;
            broadcastPeer({ server: cfg.hostname, port: cfg.p2pPort, seqNo: (cfg.hostSeqNo ?? 0) + seqNo, httpPort: cfg.httpPort });
        };
        setInterval(peerAd, cfg.p2pKeepAlive ?? 100000);
        peerAd();
    }
    return node;
};
exports.startP2P = startP2P;
const suffix = (paging) => {
    return `pageNo=${paging.page}&pageSize=${paging.chunkSize}`;
};
const remoteApi = (prefix) => ({
    announceOracle: async function (cfg, id) {
        return 'low pow difficulty';
    },
    announceCapability: async function (cfg, cp) {
        return 'low pow difficulty';
    },
    reportMalleability: async function (cfg, report) {
        return 'low pow difficulty';
    },
    disputeMissingfactClaim: async function (dispute) {
        return 'low pow difficulty';
    },
    publishOffer: async function (cfg, offer) {
        return 'low pow difficulty';
    },
    lookupOracles: async function (paging) {
        return (await (await (0, node_fetch_1.default)(prefix + "oracles?" + suffix(paging))).json());
    },
    lookupCapabilities: async function (paging, oraclePub) {
        return (await (await (0, node_fetch_1.default)(prefix + `capabilities?pubkey=${encodeURIComponent(oraclePub)}&` + suffix(paging))).json());
    },
    lookupReports: async function (paging, oraclePub) {
        return (await (await (0, node_fetch_1.default)(prefix + `reports?pubkey=${encodeURIComponent(oraclePub)}&` + suffix(paging))).json());
    },
    lookupOffers: async function (paging, capabilityPubKey) {
        return (await (await (0, node_fetch_1.default)(prefix + `offers?pubkey=${encodeURIComponent(capabilityPubKey)}&` + suffix(paging))).json());
    }
});
exports.remoteApi = remoteApi;
//# sourceMappingURL=p2p.js.map