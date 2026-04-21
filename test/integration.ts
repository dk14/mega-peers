import { ChildProcessWithoutNullStreams, exec, spawn } from 'child_process'
import waitOn from 'wait-on'
import * as fs from 'fs'
import {promisify} from 'util'
import * as nd from '../src/protocol'
import { testOnlyGenerateKeyPair, testOnlySign} from '../src/crypto'
import * as pow from '../src/pow'
import fetch from 'node-fetch'
import * as assert from 'assert'
import WebSocket, { createWebSocketStream } from 'ws';
import * as readline from 'readline'
import { stdin, stdout } from 'process'


(async () => {
    
const cleanUp = async () => {
    peers.forEach(x => x.proc?.kill())
    clientpeer.proc.kill()
    await exec('rm -r ./.tmp')
}

process.on('uncaughtException', async function (err) {
    console.log(err);
});

process.on('exit', cleanUp);
process.on('SIGINT', cleanUp);
process.on('SIGUSR1', cleanUp);
process.on('SIGUSR2', cleanUp);

const waitFor = (resources: string[]) => {
    const opts = { resources }

    return new Promise<any>((resolve, reject) => waitOn(opts, err => !err ? resolve(0): reject()))

}

interface Peer {
    proc: ChildProcessWithoutNullStreams
    port: number
}

const start = async (portP2P: number, portHttp: number, seed: number[], oraclePort?: number, oracleWsPort?: number, traderPort?: number, pub?: string): Promise<Peer> => {

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
        "p2pseed": seed.map(port => {return {"server": "localhost", "port" : port}})
    }

    if (oraclePort !== undefined && oracleWsPort !== undefined) {
        cfg["oracle"] = {
            "id": {
                "pubkey": pub,
                "oracleSignatureType" : "SHA256"
            },
            "adInterval": 1000,
            "adTopN": 10,
            "dbPath": "./.tmp/dbtest-oracle",
            "httpPort": oraclePort,
            "wsPort": oracleWsPort
        }
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
        }
    }

    try { await promisify(exec)('mkdir ./.tmp') } catch {}
    fs.writeFileSync("./.tmp/" + portP2P + ".json", JSON.stringify(cfg), { flag: "w" })
    

    const child = spawn("npx", ["tsx", "app.ts", "./.tmp/" + portP2P + ".json"])
    
    child.stderr.on('data', async function(data){
        console.log("" + data);
        await exec('rm -r ./.tmp')
        process.exit(255)
    });

    var flag = false
    return new Promise<Peer>((resolve, reject) => 
        child.stdout.on('data', function(data: string){
            //if (data.includes("[send][cmd:")) { console.log("" + data) }
            //console.log(portP2P + "|" + data)
            if (!flag) {
                resolve({
                    proc: child,
                    port: portHttp
                })
            } 
            flag = true
        })
    )
    
    
}


interface OracleIdWithPk {
    body: nd.OracleId
    pk: string
}

const genOracle = async (seqNo = 0): Promise<OracleIdWithPk> => {
    const keypair = testOnlyGenerateKeyPair()
    const oracle: nd.OracleId = {
        pubkey: keypair.pub,
        oracleSignature: undefined,
        seqNo: seqNo,
        cTTL: 0,
        pow: undefined,
        bid:  {
            amount: 0,
            proof: ''
        },
        oracleSignatureType: 'SHA256'
    }
    oracle.pow = await pow.powOverOracleId(oracle, 2)
    oracle.oracleSignature = ""
    oracle.oracleSignature = testOnlySign(JSON.stringify(oracle), keypair.pk)
    return {
        body: oracle,
        pk: keypair.pk
    }
}

const genCp = async (pubkey: string, pk: string): Promise<nd.OracleCapability> => {
    const cp: nd.OracleCapability = {
        oraclePubKey: pubkey,
        capabilityPubKey: testOnlyGenerateKeyPair().pub,
        question: 'What?',
        seqNo: 0,
        cTTL: 0,
        oracleSignature: "",
        oracleSignatureType: 'SHA256',
        pow: undefined
    }

    cp.oracleSignature = testOnlySign(JSON.stringify(cp), pk)
    cp.pow = await pow.powOverOracleCapability(cp, 2)
    return cp
}

const genReport = async (pubkey: string, cppubkey: string): Promise<nd.Report> => {
    const req: nd.FactRequest = {
        capabilityPubKey: cppubkey,
        arguments: {}
    }
    const content: nd.FactDisagreesWithPublic = {
        type: 'fact-disagreees-with-public',
        request: req
    }
    const r: nd.Report = {
        seqNo: 0,
        cTTL: 0,
        pow: undefined,
        oraclePubKey: pubkey,
        content
    }

    r.pow = await pow.powOverReport(r, 2)
    return r
}

const genOffer = async (cppubkey: string): Promise<nd.OfferMsg> => {
    const req: nd.FactRequest = {
        capabilityPubKey: cppubkey,
        arguments: {}
    }
    const terms: nd.OfferTerms = {
        question: req,
        partyBetsOn: [],
        counterPartyBetsOn: [],
        partyBetAmount: 0,
        counterpartyBetAmount: 0
    }
    const content: nd.Offer = {
        message: '',
        customContract: '',
        terms,
        blockchain: 'bitcoin-testnet',
        contact: ''
    }
    const msg: nd.OfferMsg = {
        seqNo: 0,
        cTTL: 0,
        pow: undefined,
        content
    }

    msg.pow = await pow.powOverOffer(msg, 2)
    return msg
}


const peers = await Promise.all(Array.from(Array(3).keys()).map(i => start(8433 + i, 8090 + i, [8433])))

console.log("Waiting for P2P network...")

const addr = (p: Peer) => {
    return 'http://localhost:' + p.port + '/'
}
await waitFor(peers.map(p => 'http-get://localhost:' + p.port + '/id'))

 

console.log("=========TESTING==========")

const atLeastOne = false
const reCheckInterval = 200

await new Promise(resolve => setTimeout(() => {resolve(null);}, reCheckInterval))

console.log("Protocol...\n")
var okay = false

const oracle1 = await genOracle()

console.log("1) Submit oracle id")

const response1 = await fetch(addr(peers[0]) + 'oracle', {
	method: 'post',
	body: JSON.stringify(oracle1.body),
	headers: {'Content-Type': 'application/json'}
})


const res1 = await response1.text();
assert.strictEqual(res1, '"success"')

console.log("2) Check oracle id synced across the network")

okay = false
while (!okay) {

    await fetch(addr(peers[0]) + 'oracle', {
        method: 'post',
        body: JSON.stringify(oracle1.body),
        headers: {'Content-Type': 'application/json'}
    })

    const responses = await Promise.all(peers.map(p => fetch(addr(p) + 'oracles')))
    const jsons = await Promise.all(responses.map(r => r.json()))
    const results = jsons.map(j => j as nd.OracleId[])
    let semaphore = 0


    try {
        results.forEach(r => {
            assert.deepStrictEqual(r, [oracle1.body])

            semaphore++
            if (atLeastOne || semaphore === results.length) {
                okay = true
            }
        })
    } catch {
        
    }
    await new Promise(resolve => setTimeout(() => {resolve(null);}, reCheckInterval))

    
    console.log("    synced " + semaphore + "/" + results.length)
    
    
}

console.log("")
console.log("3) Submit capability")

const cp1 = await genCp(oracle1.body.pubkey, oracle1.pk)

const response2 = await fetch(addr(peers[0]) + 'capability', {
	method: 'post',
	body: JSON.stringify(cp1),
	headers: {'Content-Type': 'application/json'}
})


const res2 = await response2.text();
assert.strictEqual(res2, '"success"')

console.log("4) Check capability synced across the network")
okay = false
while (!okay) {

    await fetch(addr(peers[0]) + 'capability', {
        method: 'post',
        body: JSON.stringify(cp1),
        headers: {'Content-Type': 'application/json'}
    })

    const responses2 = await Promise.all(peers.map(p => fetch(addr(p) + 'capabilities?pubkey=' + encodeURIComponent(oracle1.body.pubkey))))
    const jsons2 = await Promise.all(responses2.map(r => r.json()))
    const results2 = jsons2.map(j => j as nd.OracleCapability[])
    let semaphore = 0

    try {
        results2.forEach(r => {
            assert.deepStrictEqual(r, [cp1])
            semaphore++
            if (atLeastOne || semaphore === results2.length) {
                okay = true
            }
        })
    } catch {

    }
    await new Promise(resolve => setTimeout(() => {resolve(null);}, reCheckInterval))

    console.log("    synced " + semaphore + "/" + results2.length)
}
console.log("")
console.log("5) Submit report")

const r1 = await genReport(oracle1.body.pubkey, cp1.capabilityPubKey)

const response3 = await fetch(addr(peers[0]) + 'report', {
	method: 'post',
	body: JSON.stringify(r1),
	headers: {'Content-Type': 'application/json'}
})


const res3 = await response3.text();
assert.strictEqual(res3, '"success"')

console.log("6) Check report synced across the network")
okay = false
while (!okay) {

    await fetch(addr(peers[0]) + 'report', {
        method: 'post',
        body: JSON.stringify(r1),
        headers: {'Content-Type': 'application/json'}
    })

    const responses3 = await Promise.all(peers.map(p => fetch(addr(p) + 'reports?pubkey=' + encodeURIComponent(oracle1.body.pubkey))))
    const jsons3 = await Promise.all(responses3.map(r => r.json()))
    const results3 = jsons3.map(j => j as nd.OracleCapability[])
    let semaphore = 0

    try {
        results3.forEach(r => {
            assert.deepStrictEqual(r, [r1])
            semaphore++
            if (atLeastOne || semaphore === results3.length) {
                okay = true
            }
        })
    } catch {

    }

    await new Promise(resolve => setTimeout(() => {resolve(null);}, reCheckInterval))

    console.log("    synced " + semaphore + "/" + results3.length)
    
}

console.log("")
console.log("7) Submit offer")

const o1 = await genOffer(cp1.capabilityPubKey)

const response4 = await fetch(addr(peers[0]) + 'offer', {
	method: 'post',
	body: JSON.stringify(o1),
	headers: {'Content-Type': 'application/json'}
})


const res4 = await response4.text();
assert.strictEqual(res4, '"success"')

console.log("8) Check offer synced across the network")
okay = false
while (!okay) {

    await fetch(addr(peers[0]) + 'offer', {
        method: 'post',
        body: JSON.stringify(o1),
        headers: {'Content-Type': 'application/json'}
    })

    const responses4 = await Promise.all(peers.map(p => fetch(addr(p) + 'offers?pubkey=' + encodeURIComponent(cp1.capabilityPubKey))))
    const jsons4 = await Promise.all(responses4.map(r => r.json()))
    const results4 = jsons4.map(j => j as nd.OracleCapability[])
    let semaphore = 0

    try {
        results4.forEach(r => {
            assert.deepStrictEqual(r, [o1])
            semaphore++
            if (atLeastOne || semaphore === results4.length) {
                okay = true
            }
        })
    } catch {

    }

     await new Promise(resolve => setTimeout(() => {resolve(null);}, reCheckInterval))

    console.log("    synced " + semaphore + "/" + results4.length)
    
}

console.log("")

console.log("--------------------------")
console.log("Client API tests...\n")

const oracleKeypair = testOnlyGenerateKeyPair()
const traderPort = 19997
const oraclePort = 19999
const oracleWsPort = 19998
const clientpeer = await start(19443 , 19090 , [8433], oraclePort, oracleWsPort, traderPort, oracleKeypair.pub)
await waitFor(['http-get://localhost:' + traderPort + '/', 'http-get://localhost:' + oraclePort + '/', 'tcp:localhost:' + oracleWsPort])

const oraclePrefix = 'http://localhost:' + oraclePort + '/'
const traderPrefix = 'http://localhost:' + traderPort + '/'

await fetch(oraclePrefix + 'start')

const wsOracle = new WebSocket(`ws://localhost:${oracleWsPort}/signAd`)

wsOracle.on('error', console.error)
await new Promise(resolve => wsOracle.on('open', () => resolve(true)))
const streamOracle = createWebSocketStream(wsOracle, { encoding: 'utf8' })
streamOracle.on('error', console.error);
const rlOracle = readline.createInterface(streamOracle)

console.log("1. Oracle admin:")
console.log(" a) broadcast and auto-sign oracle ads")

await new Promise(resolve => {
    rlOracle.on('line', (line) => {
        //console.log(line)
        const oracleId: nd.OracleId = JSON.parse(line)
        oracleId.oracleSignature = testOnlySign(JSON.stringify(oracleId), oracleKeypair.pk)
        streamOracle.write(JSON.stringify(oracleId) + "\n")
        resolve(true)
    })
})


const wsCp = new WebSocket(`ws://localhost:${oracleWsPort}/signCp`)
await new Promise(resolve => wsCp.on('open', () => resolve(true)))
const streamCp = createWebSocketStream(wsCp, { encoding: 'utf8' })
streamCp.on('error', console.error);
const rlCp = readline.createInterface(streamCp, streamCp);

console.log(" b) create, broadcast and auto-sign new capability")

const cpKeyPair = testOnlyGenerateKeyPair()
const capabilityPubKey = cpKeyPair.pub
const question = "[it] what?"
const body = { capabilityPubKey, question }
await fetch(oraclePrefix + 'addCapability', {
    method: 'post',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'}
})

await new Promise(resolve => {
    rlCp.on('line', (line) => {
        //console.log(line)
        const cp: nd.OracleCapability = JSON.parse(line)
        cp.oracleSignature = ""
        cp.pow = undefined
        assert.strictEqual(cp.oraclePubKey, oracleKeypair.pub)
        cp.oracleSignature = testOnlySign(JSON.stringify(cp), oracleKeypair.pk)
        streamCp.write(JSON.stringify(cp) + "\n")
        resolve(true)
    })
})

okay = false
while (!okay) {
    const responses2 = await Promise.all(peers.map(p => fetch(addr(p) + 'capabilities?pubkey=' + encodeURIComponent(oracleKeypair.pub))))
    const jsons2 = await Promise.all(responses2.map(r => r.json()))
    const results2 = jsons2.map(j => j as nd.OracleCapability[])
    try {
        results2.forEach(cps => {
            const found = cps.filter(cp => cp.capabilityPubKey === capabilityPubKey)
            assert.strictEqual(found[0].capabilityPubKey, capabilityPubKey)
            assert.strictEqual(found[0].question, question)
            okay = true
        })
    } catch(err) {
        //console.log(err); okay = true;
    }
}

console.log("")
console.log("2. Trader console:")
console.log(" a) collect oracles")

const oraclesTag = "oracles"
await fetch(traderPrefix + 'collectOracles?tag=' + encodeURIComponent(oraclesTag), {
    method: 'post',
    body: JSON.stringify({
        predicate: `pubkey==='${oracleKeypair.pub}'`
    }),
    headers: {'Content-Type': 'application/json'}
})

okay = false
while (!okay) {
    try {
        const list = await (await fetch(`${traderPrefix}listOracles`)).json() as nd.OracleId[]
        assert.deepStrictEqual(list.map(o => o.pubkey), [oracleKeypair.pub])
        okay = true
    } catch(err) {
        //console.log(err); okay = true;
    }

}

console.log(" b) collect capabilities")

const cpsTag = "cps"
await fetch(traderPrefix + 'collectCapabilities?tag=' + encodeURIComponent(cpsTag), {
    method: 'post',
    body: JSON.stringify({
        oquery: `pubkey==='${oracleKeypair.pub}'`,
        opredicate: `pubkey==='${oracleKeypair.pub}'`,
        predicate: `capabilityPubKey==='${capabilityPubKey}'` 
    }),
    headers: {'Content-Type': 'application/json'}
})

okay = false
while (!okay) {
    try {
        const list = await (await fetch(`${traderPrefix}listCapabilities`)).json() as nd.OracleCapability[]
        assert.deepStrictEqual(list.map(o => o.capabilityPubKey), [capabilityPubKey])
        okay = true
    } catch(err) {
        //console.log(err); okay = true;
    }

}

console.log(" c) collect reports")


const r2 = await genReport(oracleKeypair.pub, capabilityPubKey)


const rpsTag = "rps"
await fetch(traderPrefix + 'collectReports?tag=' + encodeURIComponent(rpsTag), {
    method: 'post',
    body: JSON.stringify({
        oquery: `pubkey==='${oracleKeypair.pub}'`,
        opredicate: `pubkey==='${oracleKeypair.pub}'`,
        predicate: `true` 
    }),
    headers: {'Content-Type': 'application/json'}
})

okay = false
while (!okay) {
    try {
        await fetch(addr(peers[0]) + 'report', {
            method: 'post',
            body: JSON.stringify(r2),
            headers: {'Content-Type': 'application/json'}
        })
        const list = await (await fetch(`${traderPrefix}listReports`)).json() as nd.Report[]
        assert.deepStrictEqual(list, [r2])
        okay = true
    } catch(err) {
        //console.log(err); okay = true;
    }

}

console.log(" d) collect offers")

const o2 = await genOffer(capabilityPubKey)

const ofsTag = "ofs"
await fetch(traderPrefix + 'collectOffers?tag=' + encodeURIComponent(ofsTag), {
    method: 'post',
    body: JSON.stringify({
        cpquery: `oraclePubKey==='${oracleKeypair.pub}'`,
        cppredicate: `capabilityPubKey==='${capabilityPubKey}'`,
        predicate: `true` 
    }),
    headers: {'Content-Type': 'application/json'}
})

okay = false
while (!okay) {
    try {
        await fetch(addr(peers[0]) + 'offer', {
            method: 'post',
            body: JSON.stringify(o2),
            headers: {'Content-Type': 'application/json'}
        })
        const list = await (await fetch(`${traderPrefix}listOffers`)).json() as nd.OfferMsg[]
        assert.deepStrictEqual(list, [o2])
        okay = true
    } catch(err) {
        //console.log(err); okay = true;
    }

}



clientpeer.proc.kill()
console.log("--------------------------")
peers.forEach(x => x.proc.kill())

console.log("OK!")
process.exit(0)

})()
