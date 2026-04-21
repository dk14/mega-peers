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
const child_process_1 = require("child_process");
const wait_on_1 = __importDefault(require("wait-on"));
const fs = __importStar(require("fs"));
const util_1 = require("util");
const crypto_1 = require("../src/crypto");
const pow = __importStar(require("../src/pow"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const assert = __importStar(require("assert"));
const ws_1 = __importStar(require("ws"));
const readline = __importStar(require("readline"));
(async () => {
    const cleanUp = async () => {
        peers.forEach(x => x.proc?.kill());
        clientpeer.proc.kill();
        await (0, child_process_1.exec)('rm -r ./.tmp');
    };
    process.on('uncaughtException', async function (err) {
        console.log(err);
    });
    process.on('exit', cleanUp);
    process.on('SIGINT', cleanUp);
    process.on('SIGUSR1', cleanUp);
    process.on('SIGUSR2', cleanUp);
    const waitFor = (resources) => {
        const opts = { resources };
        return new Promise((resolve, reject) => (0, wait_on_1.default)(opts, err => !err ? resolve(0) : reject()));
    };
    const start = async (portP2P, portHttp, seed, oraclePort, oracleWsPort, traderPort, pub) => {
        const cfg = {
            "maxOracles": 10,
            "maxCapabilities": 10,
            "maxReports": 2,
            "maxOffers": 2,
            "maxConnections": 100,
            "maxMsgLength": 1000000,
            "httpPort": portHttp,
            "p2pPort": portP2P,
            "p2pKeepAlive": 100,
            "hostname": "localhost",
            "isTest": true,
            "p2pseed": seed.map(port => { return { "server": "localhost", "port": port }; })
        };
        if (oraclePort !== undefined && oracleWsPort !== undefined) {
            cfg["oracle"] = {
                "id": {
                    "pubkey": pub,
                    "oracleSignatureType": "SHA256"
                },
                "adInterval": 1000,
                "adTopN": 10,
                "dbPath": "./.tmp/dbtest-oracle",
                "httpPort": oraclePort,
                "wsPort": oracleWsPort
            };
        }
        if (traderPort !== undefined) {
            cfg["trader"] = {
                "broadcastOfferCycle": 3000,
                "broadcastReportCycle": 3000,
                "collectOffersCycle": 2000,
                "collectReportsCycle": 2000,
                "collectOracleAdsCycle": 2000,
                "collectOracleCpCycle": 2000,
                "pageSize": 100,
                "maxOraclesPages": 2,
                "maxCpPages": 2,
                "maxReportsPages": 2,
                "maxOffersPages": 2,
                "maxCollectors": 2,
                "dbPath": "./.tmp/dbtest",
                "httpPort": traderPort
            };
        }
        try {
            await (0, util_1.promisify)(child_process_1.exec)('mkdir ./.tmp');
        }
        catch { }
        fs.writeFileSync("./.tmp/" + portP2P + ".json", JSON.stringify(cfg), { flag: "w" });
        const child = (0, child_process_1.spawn)("npx", ["tsx", "app.ts", "./.tmp/" + portP2P + ".json"]);
        child.stderr.on('data', async function (data) {
            console.log("" + data);
            await (0, child_process_1.exec)('rm -r ./.tmp');
            process.exit(255);
        });
        var flag = false;
        return new Promise((resolve, reject) => child.stdout.on('data', function (data) {
            //if (data.includes("[send][cmd:")) { console.log("" + data) }
            //console.log(portP2P + "|" + data)
            if (!flag) {
                resolve({
                    proc: child,
                    port: portHttp
                });
            }
            flag = true;
        }));
    };
    const genOracle = async (seqNo = 0) => {
        const keypair = (0, crypto_1.testOnlyGenerateKeyPair)();
        const oracle = {
            pubkey: keypair.pub,
            oracleSignature: undefined,
            seqNo: seqNo,
            cTTL: 0,
            pow: undefined,
            bid: {
                amount: 0,
                proof: ''
            },
            oracleSignatureType: 'SHA256'
        };
        oracle.pow = await pow.powOverOracleId(oracle, 2);
        oracle.oracleSignature = "";
        oracle.oracleSignature = (0, crypto_1.testOnlySign)(JSON.stringify(oracle), keypair.pk);
        return {
            body: oracle,
            pk: keypair.pk
        };
    };
    const genCp = async (pubkey, pk) => {
        const cp = {
            oraclePubKey: pubkey,
            capabilityPubKey: (0, crypto_1.testOnlyGenerateKeyPair)().pub,
            question: 'What?',
            seqNo: 0,
            cTTL: 0,
            oracleSignature: "",
            oracleSignatureType: 'SHA256',
            pow: undefined
        };
        cp.oracleSignature = (0, crypto_1.testOnlySign)(JSON.stringify(cp), pk);
        cp.pow = await pow.powOverOracleCapability(cp, 2);
        return cp;
    };
    const genReport = async (pubkey, cppubkey) => {
        const req = {
            capabilityPubKey: cppubkey,
            arguments: {}
        };
        const content = {
            type: 'fact-disagreees-with-public',
            request: req
        };
        const r = {
            seqNo: 0,
            cTTL: 0,
            pow: undefined,
            oraclePubKey: pubkey,
            content
        };
        r.pow = await pow.powOverReport(r, 2);
        return r;
    };
    const genOffer = async (cppubkey) => {
        const req = {
            capabilityPubKey: cppubkey,
            arguments: {}
        };
        const terms = {
            question: req,
            partyBetsOn: [],
            counterPartyBetsOn: [],
            partyBetAmount: 0,
            counterpartyBetAmount: 0
        };
        const content = {
            message: '',
            customContract: '',
            terms,
            blockchain: 'bitcoin-testnet',
            contact: ''
        };
        const msg = {
            seqNo: 0,
            cTTL: 0,
            pow: undefined,
            content
        };
        msg.pow = await pow.powOverOffer(msg, 2);
        return msg;
    };
    const peers = await Promise.all(Array.from(Array(3).keys()).map(i => start(8433 + i, 8090 + i, [8433])));
    console.log("Waiting for P2P network...");
    const addr = (p) => {
        return 'http://localhost:' + p.port + '/';
    };
    await waitFor(peers.map(p => 'http-get://localhost:' + p.port + '/id'));
    console.log("=========TESTING==========");
    const atLeastOne = false;
    const reCheckInterval = 200;
    await new Promise(resolve => setTimeout(() => { resolve(null); }, reCheckInterval));
    console.log("Protocol...\n");
    var okay = false;
    const oracle1 = await genOracle();
    console.log("1) Submit oracle id");
    const response1 = await (0, node_fetch_1.default)(addr(peers[0]) + 'oracle', {
        method: 'post',
        body: JSON.stringify(oracle1.body),
        headers: { 'Content-Type': 'application/json' }
    });
    const res1 = await response1.text();
    assert.strictEqual(res1, '"success"');
    console.log("2) Check oracle id synced across the network");
    okay = false;
    while (!okay) {
        await (0, node_fetch_1.default)(addr(peers[0]) + 'oracle', {
            method: 'post',
            body: JSON.stringify(oracle1.body),
            headers: { 'Content-Type': 'application/json' }
        });
        const responses = await Promise.all(peers.map(p => (0, node_fetch_1.default)(addr(p) + 'oracles')));
        const jsons = await Promise.all(responses.map(r => r.json()));
        const results = jsons.map(j => j);
        let semaphore = 0;
        try {
            results.forEach(r => {
                assert.deepStrictEqual(r, [oracle1.body]);
                semaphore++;
                if (atLeastOne || semaphore === results.length) {
                    okay = true;
                }
            });
        }
        catch {
        }
        await new Promise(resolve => setTimeout(() => { resolve(null); }, reCheckInterval));
        console.log("    synced " + semaphore + "/" + results.length);
    }
    console.log("");
    console.log("3) Submit capability");
    const cp1 = await genCp(oracle1.body.pubkey, oracle1.pk);
    const response2 = await (0, node_fetch_1.default)(addr(peers[0]) + 'capability', {
        method: 'post',
        body: JSON.stringify(cp1),
        headers: { 'Content-Type': 'application/json' }
    });
    const res2 = await response2.text();
    assert.strictEqual(res2, '"success"');
    console.log("4) Check capability synced across the network");
    okay = false;
    while (!okay) {
        await (0, node_fetch_1.default)(addr(peers[0]) + 'capability', {
            method: 'post',
            body: JSON.stringify(cp1),
            headers: { 'Content-Type': 'application/json' }
        });
        const responses2 = await Promise.all(peers.map(p => (0, node_fetch_1.default)(addr(p) + 'capabilities?pubkey=' + encodeURIComponent(oracle1.body.pubkey))));
        const jsons2 = await Promise.all(responses2.map(r => r.json()));
        const results2 = jsons2.map(j => j);
        let semaphore = 0;
        try {
            results2.forEach(r => {
                assert.deepStrictEqual(r, [cp1]);
                semaphore++;
                if (atLeastOne || semaphore === results2.length) {
                    okay = true;
                }
            });
        }
        catch {
        }
        await new Promise(resolve => setTimeout(() => { resolve(null); }, reCheckInterval));
        console.log("    synced " + semaphore + "/" + results2.length);
    }
    console.log("");
    console.log("5) Submit report");
    const r1 = await genReport(oracle1.body.pubkey, cp1.capabilityPubKey);
    const response3 = await (0, node_fetch_1.default)(addr(peers[0]) + 'report', {
        method: 'post',
        body: JSON.stringify(r1),
        headers: { 'Content-Type': 'application/json' }
    });
    const res3 = await response3.text();
    assert.strictEqual(res3, '"success"');
    console.log("6) Check report synced across the network");
    okay = false;
    while (!okay) {
        await (0, node_fetch_1.default)(addr(peers[0]) + 'report', {
            method: 'post',
            body: JSON.stringify(r1),
            headers: { 'Content-Type': 'application/json' }
        });
        const responses3 = await Promise.all(peers.map(p => (0, node_fetch_1.default)(addr(p) + 'reports?pubkey=' + encodeURIComponent(oracle1.body.pubkey))));
        const jsons3 = await Promise.all(responses3.map(r => r.json()));
        const results3 = jsons3.map(j => j);
        let semaphore = 0;
        try {
            results3.forEach(r => {
                assert.deepStrictEqual(r, [r1]);
                semaphore++;
                if (atLeastOne || semaphore === results3.length) {
                    okay = true;
                }
            });
        }
        catch {
        }
        await new Promise(resolve => setTimeout(() => { resolve(null); }, reCheckInterval));
        console.log("    synced " + semaphore + "/" + results3.length);
    }
    console.log("");
    console.log("7) Submit offer");
    const o1 = await genOffer(cp1.capabilityPubKey);
    const response4 = await (0, node_fetch_1.default)(addr(peers[0]) + 'offer', {
        method: 'post',
        body: JSON.stringify(o1),
        headers: { 'Content-Type': 'application/json' }
    });
    const res4 = await response4.text();
    assert.strictEqual(res4, '"success"');
    console.log("8) Check offer synced across the network");
    okay = false;
    while (!okay) {
        await (0, node_fetch_1.default)(addr(peers[0]) + 'offer', {
            method: 'post',
            body: JSON.stringify(o1),
            headers: { 'Content-Type': 'application/json' }
        });
        const responses4 = await Promise.all(peers.map(p => (0, node_fetch_1.default)(addr(p) + 'offers?pubkey=' + encodeURIComponent(cp1.capabilityPubKey))));
        const jsons4 = await Promise.all(responses4.map(r => r.json()));
        const results4 = jsons4.map(j => j);
        let semaphore = 0;
        try {
            results4.forEach(r => {
                assert.deepStrictEqual(r, [o1]);
                semaphore++;
                if (atLeastOne || semaphore === results4.length) {
                    okay = true;
                }
            });
        }
        catch {
        }
        await new Promise(resolve => setTimeout(() => { resolve(null); }, reCheckInterval));
        console.log("    synced " + semaphore + "/" + results4.length);
    }
    console.log("");
    console.log("--------------------------");
    console.log("Client API tests...\n");
    const oracleKeypair = (0, crypto_1.testOnlyGenerateKeyPair)();
    const traderPort = 19997;
    const oraclePort = 19999;
    const oracleWsPort = 19998;
    const clientpeer = await start(19443, 19090, [8433], oraclePort, oracleWsPort, traderPort, oracleKeypair.pub);
    await waitFor(['http-get://localhost:' + traderPort + '/', 'http-get://localhost:' + oraclePort + '/', 'tcp:localhost:' + oracleWsPort]);
    const oraclePrefix = 'http://localhost:' + oraclePort + '/';
    const traderPrefix = 'http://localhost:' + traderPort + '/';
    await (0, node_fetch_1.default)(oraclePrefix + 'start');
    const wsOracle = new ws_1.default(`ws://localhost:${oracleWsPort}/signAd`);
    wsOracle.on('error', console.error);
    await new Promise(resolve => wsOracle.on('open', () => resolve(true)));
    const streamOracle = (0, ws_1.createWebSocketStream)(wsOracle, { encoding: 'utf8' });
    streamOracle.on('error', console.error);
    const rlOracle = readline.createInterface(streamOracle);
    console.log("1. Oracle admin:");
    console.log(" a) broadcast and auto-sign oracle ads");
    await new Promise(resolve => {
        rlOracle.on('line', (line) => {
            //console.log(line)
            const oracleId = JSON.parse(line);
            oracleId.oracleSignature = (0, crypto_1.testOnlySign)(JSON.stringify(oracleId), oracleKeypair.pk);
            streamOracle.write(JSON.stringify(oracleId) + "\n");
            resolve(true);
        });
    });
    const wsCp = new ws_1.default(`ws://localhost:${oracleWsPort}/signCp`);
    await new Promise(resolve => wsCp.on('open', () => resolve(true)));
    const streamCp = (0, ws_1.createWebSocketStream)(wsCp, { encoding: 'utf8' });
    streamCp.on('error', console.error);
    const rlCp = readline.createInterface(streamCp, streamCp);
    console.log(" b) create, broadcast and auto-sign new capability");
    const cpKeyPair = (0, crypto_1.testOnlyGenerateKeyPair)();
    const capabilityPubKey = cpKeyPair.pub;
    const question = "[it] what?";
    const body = { capabilityPubKey, question };
    await (0, node_fetch_1.default)(oraclePrefix + 'addCapability', {
        method: 'post',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    });
    await new Promise(resolve => {
        rlCp.on('line', (line) => {
            //console.log(line)
            const cp = JSON.parse(line);
            cp.oracleSignature = "";
            cp.pow = undefined;
            assert.strictEqual(cp.oraclePubKey, oracleKeypair.pub);
            cp.oracleSignature = (0, crypto_1.testOnlySign)(JSON.stringify(cp), oracleKeypair.pk);
            streamCp.write(JSON.stringify(cp) + "\n");
            resolve(true);
        });
    });
    okay = false;
    while (!okay) {
        const responses2 = await Promise.all(peers.map(p => (0, node_fetch_1.default)(addr(p) + 'capabilities?pubkey=' + encodeURIComponent(oracleKeypair.pub))));
        const jsons2 = await Promise.all(responses2.map(r => r.json()));
        const results2 = jsons2.map(j => j);
        try {
            results2.forEach(cps => {
                const found = cps.filter(cp => cp.capabilityPubKey === capabilityPubKey);
                assert.strictEqual(found[0].capabilityPubKey, capabilityPubKey);
                assert.strictEqual(found[0].question, question);
                okay = true;
            });
        }
        catch (err) {
            //console.log(err); okay = true;
        }
    }
    console.log("");
    console.log("2. Trader console:");
    console.log(" a) collect oracles");
    const oraclesTag = "oracles";
    await (0, node_fetch_1.default)(traderPrefix + 'collectOracles?tag=' + encodeURIComponent(oraclesTag), {
        method: 'post',
        body: JSON.stringify({
            predicate: `pubkey==='${oracleKeypair.pub}'`
        }),
        headers: { 'Content-Type': 'application/json' }
    });
    okay = false;
    while (!okay) {
        try {
            const list = await (await (0, node_fetch_1.default)(`${traderPrefix}listOracles`)).json();
            assert.deepStrictEqual(list.map(o => o.pubkey), [oracleKeypair.pub]);
            okay = true;
        }
        catch (err) {
            //console.log(err); okay = true;
        }
    }
    console.log(" b) collect capabilities");
    const cpsTag = "cps";
    await (0, node_fetch_1.default)(traderPrefix + 'collectCapabilities?tag=' + encodeURIComponent(cpsTag), {
        method: 'post',
        body: JSON.stringify({
            oquery: `pubkey==='${oracleKeypair.pub}'`,
            opredicate: `pubkey==='${oracleKeypair.pub}'`,
            predicate: `capabilityPubKey==='${capabilityPubKey}'`
        }),
        headers: { 'Content-Type': 'application/json' }
    });
    okay = false;
    while (!okay) {
        try {
            const list = await (await (0, node_fetch_1.default)(`${traderPrefix}listCapabilities`)).json();
            assert.deepStrictEqual(list.map(o => o.capabilityPubKey), [capabilityPubKey]);
            okay = true;
        }
        catch (err) {
            //console.log(err); okay = true;
        }
    }
    console.log(" c) collect reports");
    const r2 = await genReport(oracleKeypair.pub, capabilityPubKey);
    const rpsTag = "rps";
    await (0, node_fetch_1.default)(traderPrefix + 'collectReports?tag=' + encodeURIComponent(rpsTag), {
        method: 'post',
        body: JSON.stringify({
            oquery: `pubkey==='${oracleKeypair.pub}'`,
            opredicate: `pubkey==='${oracleKeypair.pub}'`,
            predicate: `true`
        }),
        headers: { 'Content-Type': 'application/json' }
    });
    okay = false;
    while (!okay) {
        try {
            await (0, node_fetch_1.default)(addr(peers[0]) + 'report', {
                method: 'post',
                body: JSON.stringify(r2),
                headers: { 'Content-Type': 'application/json' }
            });
            const list = await (await (0, node_fetch_1.default)(`${traderPrefix}listReports`)).json();
            assert.deepStrictEqual(list, [r2]);
            okay = true;
        }
        catch (err) {
            //console.log(err); okay = true;
        }
    }
    console.log(" d) collect offers");
    const o2 = await genOffer(capabilityPubKey);
    const ofsTag = "ofs";
    await (0, node_fetch_1.default)(traderPrefix + 'collectOffers?tag=' + encodeURIComponent(ofsTag), {
        method: 'post',
        body: JSON.stringify({
            cpquery: `oraclePubKey==='${oracleKeypair.pub}'`,
            cppredicate: `capabilityPubKey==='${capabilityPubKey}'`,
            predicate: `true`
        }),
        headers: { 'Content-Type': 'application/json' }
    });
    okay = false;
    while (!okay) {
        try {
            await (0, node_fetch_1.default)(addr(peers[0]) + 'offer', {
                method: 'post',
                body: JSON.stringify(o2),
                headers: { 'Content-Type': 'application/json' }
            });
            const list = await (await (0, node_fetch_1.default)(`${traderPrefix}listOffers`)).json();
            assert.deepStrictEqual(list, [o2]);
            okay = true;
        }
        catch (err) {
            //console.log(err); okay = true;
        }
    }
    clientpeer.proc.kill();
    console.log("--------------------------");
    peers.forEach(x => x.proc.kill());
    console.log("OK!");
    process.exit(0);
})();
//# sourceMappingURL=integration.js.map