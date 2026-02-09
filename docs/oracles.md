
# Oracle API
Oracle API provides functionality for managing `OracleId`. It allows Oracle to advertise itself in the network.

Oracle advertises:
- its `OracleId` which is presentation of oracle's physical identity.
- its capabilities, which are specifications of features oracle supports: questions it can answer, together with information necesssary for traders to query (e.g. Mega-compatible endpoint).

> Both `OracleId` and capabilities contain proof of work (SHA256) done. `OracleId` takes root oracle pubkey as input for PoW, capability takes `oracleSignature` over that capability as input for PoW. 

> Additional, domain-based identity verification is possible for orgs through `manifestUri` field in `OracleId` (see TLDR chapter).

Oracle API is built on top of operator API (mempools), since both advertising oracles and listening traders are also operating nodes in Mega-P2P.

Oracle API provides:
- CPU-PoW
- local capability database
- interface for signing ads
- scheduled advertiser

Mega-repo contains reference implementation of the protocol and non-essential APIs. Oracles are at liberty to create their own as long as it communicates using standard `src/protocol.ts` messages.

Reference implementation is exposed as REST-service.

## Configure

Adding `oracle` parameter in mempool configuration would start local Oracle API REST together with node.

Example: `cfg/mempool-oracle.json`

Basic information about oracle can be specified right in config as `OracleBasicIdentity`.

```ts

export interface OracleBasicIdentity {
    pubkey: string
    oracleSignatureType: string
    manifestUri?: string
}

export interface OracleCfg {
    id: OracleBasicIdentity
    adInterval: number
    adTopN: number
    dbPath: string
    httpPort: number
    wsPort: number
}
```

`cfg/mempool-oracle.json`

```js
{
    ...mempool params; see Operators doc
    "oracle": { //oracle params 
        "id": {
            "pubkey": "<your root pubkey>",
            "oracleSignatureType" : "SHA256"
        },
        "adInterval": 10000,
        "adTopN": 10,
        "dbPath": "./db/myoracle", //database
        "httpPort": 9080,
        "wsPort": 9081 //for signers
    }
}
```



## Start peer with oracle-api enabled

from sources:
```bash
npm run peer cfg/mempool-oracle.json
```

from the library:
```bash
npm i dk14/mega-peers
npx mega-peer cfg/mempool-oracle.json 
```

Oracle Admin UI and REST will be available at:

- http://localhost:7080/

> Security: **NO** ports should be open to public network in this mode. Use virtualization (e.g. virsh). No inbound connections.

-----

You can run a full demo for plug and play:
```bash
npm run demo
```
from git-npm-repository:
```bash
npm install dk14/mega-peers
npx mega-demo
```
- Peer UI: http://localhost:8080/peer-monitor/
- Oracle Admin UI: http://localhost:8080/oracle-admin/
- Mockup Oracle: http://localhost:8080/oracle-endpoint/
- Trader Console UI: http://localhost:8080/trader-console/
- Oracle Ad Signer would connect to `ws-port:9081` at Oracle Admin

> Security: no ports should be open to public network in this mode. Use virtualization (e.g. virsh)

## Start advertising

This will start advertising `OracleId` as well as capabilities found in database.
```ts
fetch('./start')
```

## Register capability

Capability can be registered in a database from minimal `BasicOracleCapability` specification.

Capabilities are **signed** with  a signature corresponding to original `OracleId` pubkey (root pubkey). 

Capabilities are **identified** through their own pubkeys - the ones that are used to sign actual service provider commitments and data (see Endpoints).

>Note: there is a limitation on the maximum length of the `OracleCapability` message.

```ts
const capabilityPubKey = ...
const question = "Humanity extinct in $date years?"
const endpoint = "http://..." //can be nostr post, IRC, SESSION messenger or WhatsApp handle

// params can be empty, 
// `values === []` means unbounded type
const params = [{name: "date", values: [1, 5, 10]}]
const answers = ["YES", "NO"] // optional for ads, but contract-generators would require it; can be range e.g. "0..100" if contract-generator supports it

const body: OracleBasicCapability = { capabilityPubKey, question, endpoint, params, answers }
const res = await fetch('./addCapability', {
    method: 'post',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'}
})
```

Capability specifications are typed. Thus, Oracle must specify a finite set of possible answers to the question. For ranges of integers or real numbers, we recommend to enumerate, but if traders support it - you can rely on conventions.
- "0..3" means [0,1,2,3]
- "0..2..every0.5" means [0, 0.5, 1.0, 1.5, 2]

Capability specifications allow parametrized queries characterized by parameter `name` and set of acceptable arguments `values`.

## Deactivate capability
Deactivation/Reactivation is the only type of update of capability spec, that Mega-mempools support. Any other update will be rejected as duplicate.

Mutation of spec is nevertheless possible in cases when capability is partially or completely evicted from mempools. Such mutation would put oracle at risk of being reported for capability collision (`ad-collision` report). It could also cause both versions to exist in mempools.

Deactivation does not evict capabilities from mempools - it only marks endpoint as unavailable for queries.

**Thus, proper update is to-deactivate old one and activate a new capability with newly issued pubkey.** Possibly referring to the same endpoint. 

```ts
await fetch('./deactivateCapability?pubkey=' + encodeURIComponent(capabilityPubKey))
```

## Reactivate capability
If capability was deactivated by mistake or service was temporary unavailable - they can be reactivated.
```ts
await fetch('./activateCapability?pubkey=' + encodeURIComponent(capabilityPubKey))
```

## Drop capability from local storage
If capability was deactivated due to permanent deprecation - it can be dropped from database.

```ts
const capabilityPubKey = document.getElementById('pubkeymanage').value
            await fetch('./dropCapability?pubkey=' + encodeURIComponent(capabilityPubKey))
```

## Upgrade capability PoW

```ts
const difficulty = ...
await fetch('./upgradeCapabilityPow?pubkey=' + encodeURIComponent(capabilityPubKey)
             + "&difficulty=" + encodeURIComponent(difficulty))
```

## Upgrade oracle PoW

```ts
const difficulty = ...
await fetch('./upgradeOraclePow?pubkey=' + encodeURIComponent(capabilityPubKey)
             + "&difficulty=" + encodeURIComponent(difficulty))
```

## View oracle ad
Contains of `OracleId` as advertised in the network (it is created based on `BasicOracleIdentity` configuration)
```ts
await (await fetch('./id')).json()
```

## List registered capabilities

```ts
const cps = await (await fetch('./viewStoredCapabilities?pageSize=100&pageNo=0')).json()
```

# Authenticity

## How to sign ads as oracle 
 `src/client-api/oracle-auto-signer.ts` has an example.

After starting oracle api,
`ws://host:port/signCp` and `ws://host:port/signAd` would give you REPL stream for signing capability ads and oracle ads respectively. You read a message - you write same message but with `oracleSignature`.

The best approach is to sign messages manually unless they only differ in `seqNo` field.

> Oracle capabilities are signed **without** PoW. Anyone can upgrade PoW of oracle's capability. 

> `OracleId` is signed **with** PoW - only oracle can upgrade its `OracleId` PoW.

## Signatures

Oracle ads and capabilites are signed with root oracle signature.

Commitments and facts are signed with a corresponding capability signature.


Security note:
- signing capability which is identified through `capabilityPubKey` not belonging to oracle would allow owner of corresponding private key to make commitments and provide facts on behalf of oracle. Even if attacker does not control oracle's endpoint - it could still publish reports with proved `fact-conflict` or dispute `missing-fact` reports with erroneous data.
- Thus, it is recommended to derive capability private keys from same PK as root oracle private key (HD-wallet approach)

## Foreign advertisers (synthetic oracles)
Some corporate oracles might not wish to do PoW in order to advertise themselves through Mega P2P, but they would wish to keep Mega-protocol and standard for endpoints.

They can publish manifest (json of `OracleManifest`) with a list of `OracleCapability` on their website and use protocol without mempools. Legal entity would only adopt `OracleCapability`, `Commitment`,`Fact` messages. Unlike regular, website-verified oracle, they would not create ads for `OracleId`, nor advertise it through Mega P2P.

**They would, however need to be reported independently.**

In that case, third-party public org can create synthetic (e.g. `Wolfram (foreign advertiser)`) id. 
It would point to original manifest on original (e.g. "wolfram.com"), but unlike with website-veified PoW-oracles - manifest won't point back to synthetic `OracleId`.

> While original non-advertised `OracleId` is signed with Wolfram signature, foreign advertised `OracleId` is signed with advertiser's signature. Mega does not allow PoW on `OracleId` without signing it together with PoW, thus only `OracleId` signer can upgrade PoW (only signer can advertise). Note: capabilities can be advertised by anyone, including traders themselves ("like" button).

This would allow, such synthetic oracle to sign foreign capapbilities (the ones published by wolfram) and propagate reports and offers through Mega P2P. 

Example: a partner of Mega-powered trading app who decided to support let's say Wolfram without requiring them to do PoW, becomes such synthetic oracle (foreign advertiser) and would do PoW for adopted foreign capabilities. They will NOT need Wolfram approval to advertise (unless Wolfram decides to delegate to them completely as a trusted party, by publishing special manifest for them).

- "broken" manifest back-reference is allowed but would be marked as "foreign advertiser for wolfram.com" for traders. This is the main difference between foreign advertiser and delegated/original domain-verified oracle.
- foreign advertiser is only responsible for reputation of such synthetic id. 
- Foreign advertiser has to trust let's say Wolfram to not be reported, otherwise the PoW-resources that advertiser spends would be in vein.

Security:
- synthetic oracle would not have access to id/capapbility private keys of original oracle. It can only add foreign capabilities (signing them with own signature), but won't be able to issue legally binding commitments
- original oracle is still responsible for commitments
- reports are filed independently from synthetic oracle by traders themselves
- synthetic oracle does PoW for its synthetic id and adopted capabilities. Rank management is foreign advertiser's responsibility

> Capabilities are not required to be self-signed in Mega. We only verify `OracleId` to `OracleCapability` link in order to compute PoW-rank

- > It is secure since only `Commitment` (signed with `CapabilityPub`) is legally binding. Only e.g. wolfram.com can sign such commitment.

## TLDR
**The minimum legal entity needs to onboard Mega as an oracle - is to**: 
- implement http-endpoint according to Mega-standard (see "Oracle Endpoint" chapter)
- sign and publish `OracleManifest` (`src/protocol.ts`) on your domain

```ts
export interface OracleManifest { 
    domain: string
    id: OracleId
    meta: any
    capapbilities: OracleCapability[]
    signature: string
    sinatureType: string
}
```

Then legal entity can decide wether they wish to crreate and P2P-advertise PoW-based identity directly or delegate or wait for foreign advertisers to pick manifest up.

----

The minimum individual needs is to:
- implement whatever endpoint (can be messenger) with support for `FactRequest`, `Commitment`, `Fact` messages (`src/protocol.ts`), e.g. share jsons manually or through a bot
- configure and start the node,
- use oracle-api to PoW-advertise!

> Note: you can implement your own oracle-api based on `src/protocol.ts` and `src/api.ts` (see Operators doc). Oracle API is nothing but a wrapper.
----

```ts
export interface FactRequest {
    capabilityPubKey: string
    // arguments can be empty if question is concrete 
    // can pre-commit to a range for tickers
    // e.g. {"date": "today..tomorrow;every(second)"}
    arguments: { [id: string] : string; } 
    invoice?: string // paid invoice to verify, e.g. BTC-LN invoice
}

export interface Fact { // your attestation
    factWithQuestion: string
    signatureType: string
    signature: string
}

export interface Commitment {
    req: FactRequest
    contract: string // for slashing and such, can be empty
    rValueSchnorrHex?: string // committed nonce for BTC-DLC
    oracleSig: string
    factRetentionPeriod?: string // how long would fact be available in your mind/database if any
}
```

## PoW

examples: `src/pow.ts`

```ts
export interface OraclePow {
    powOverOracleId: (o: OracleId, difficulty: number, algorithm: string) => Promise<HashCashPow>
    powOverOracleCapability: (cp: OracleCapability, difficulty: number, algorithm: string) => Promise<HashCashPow>
}
```
Oarcle API has default CPU implementation for pow.

# Customize Oracle API
`src/client-api/oracle-control-api.ts`

```ts
// implement you own database (default one is filesystem)

import { CapabilityStorage } from '@dk14/mega-peers/oracle-control-api'
import { api as ndapi } from "./src/api";
import { p2pNode } from "./src/p2p";

// configuration:
const cfg: MempoolConfig<PeerAddr> = {
    ... //regular mempool config
    "oracle": {
        "id": {
            "pubkey": "AAA",
            "oracleSignatureType" : "SHA256"
        },
        "adInterval": 10000, //how often to send ads
        "adTopN": 10
    }
}
// add your own database
const storage: CapabilityStorage<YourQueryType> = { ... }

// your own mining
const miner: OraclePow = { ... }

// create api:
const oracleApi: OracleControlAPI = oracleControlApi(cfg, ndapi, storage, p2pNode, miner)

// register your signers
await oracleApi.watchSignMyOracleBroadcasts(oracleIdSigner)
await oracleApi.watchSignMyCapabilityBroadcasts(oracleAdSigner)

// use api
await oracleApi.startAdvertising(cfg.oracle)

await oracleApi.addCapability(...)
await oracleApi.dropCapability(...)

await upgradeOraclePow(difficulty) 
await upgradeCapabilityPow(pub, difficulty)
```

## Dispute "Fact Missing" reports

Oracle can dispute `fact-missing` reports by broacasting `Dispute` message to Mega P2P. This is available in the Mega-protocol API (see Operator doc).

# Oracle Endpoint
Oracle endpoint has to implement this interface over REST:

```ts
// see TLDR paragraph for `FactRequest`, `Fact`, `Commitment` interfaces
export interface OracleEndpointApi {
    requestNewCapability (question: string): Promise<OracleCapability | undefined>
    requestCommitment: (req: FactRequest) => Promise<Commitment | undefined>
    requestFact: (req: Commitment) => Promise<Fact>
}
```

> Oracle does NOT have to store commitments in its database, since they are already authentified with capability signature. Trader will give your commitment back during `requestFact` inquiry. Same goes for Schnorr r-values (optional feature) - they are calculated from (parametrized) `question` itself - no need to store them; also commitment is signed already when `requestFact`- so Schnorr `r-value` can be taken from it directly. **No overhead in either case**: wether you recalculate `r-value` or take one from commitment signed by you. Only capability private key has to be stored (securely) - one per capability.

> Schnorr note: it is insecure to sign two different messages with same `r-value` (nonce). Providing conflicting answers to the same question would not only penalize your reputation - it would invalidate your `capabilitySignature` (reveal capability private key). If it happens, you have to deactivate capability (see above) and create a new one. And take the fall in reputation for not managing your data properly. Same goes for most asymmetric schemes.

> Schnorr note: in rare cases, when you accidentally sign same message with same `r-value` but different private keys, differential cryptoanalysis might recover some of the information about private key (in naive cases it definitely can - `pk1 - pk2`), so ideally (parametrized) question should be part of the fact and **mandatorily** `r-value` should be derived from both private key and question and random number (see `schnorr.ts`).

> P.S. "parametrized" question means with parametres (arguments), e.g. "will this happen on $date?" - date (e.g. "1 Jan 1519") has to be included: "will this happen on 1 Jan 1519?".

Every capability can have its own endpoint or they can share.

If oracle provides facts through messengers, blockchain or any other means (including `fact-missing` report as a hack), then it must be able to manually or chat-bot-automatically send `commitment` and eventually `fact` as json in response to `fact-request` message json.

**Commitments are signed and legally binding. Oracle can be reported for not fulfilling (or misfulfilling) the commitment it made.**

## Blockchain-agnostic

It is NOT recommended (STRONGLY discouraged) for oracles to tie facts or commitments to blockchain contracts belonging to traders. If oracle (optionally) uses blockchain to guarantee SLA fullfillment, it should do so in a separate transaction: only publish commitments (optionally) and facts, do NOT sign trading transactions for traders.

Separation of responsibilities:

- Mega encourages pull-based approach for privacy
- oracle must NOT KNOW anything about contracts relying on its data - Mega does not share that information with oracles (even "offers API" in mempools allows for encryption and obfuscation, as well as private p2p). Only `fact-req` is known to oracle. This is strongly recommended in order to prevent naive market manipulation by oracles themselves.
- moreover, in Mega, oracle does not have to know about blockchain existence either. Mega DOES NOT require oracles to maintain blockchain wallets (full nodes etc).
- only endpoint, lightweight Mega-node (mempool connected to p2p) with `oracle-api` activated are required to run and advertise an oracle. 
- > Corporate orgs can delegate p2p-node and mining, but then third-party would either have PoW-resources owning id (full proxy) or become foreign advertiser with its own projection of corporate identity (recommended).

> traders can file `free-form` report and simply vote with PoW against oracle if they find their privacy leaked, suspect market manipulation or any other flaws to fix.

-----
Example of endpoint implementation from `src/client-api/utils/oracle-endpoint`:

```ts
import { OracleEndpointApi } from '@dk14/mega-peers/oracle-endpoint-api'

//optional, can check proof of payment here
const canCommit = ... 

// optional, can pledge something on blockchain, add quorum contract
// `src/client-api/contracts/slasher.ts` - MAD-DLC-slashing example
const generateSLA = ... 

// external signing; example of auto-signer: src/client-api/oracle-endpoint-signer.ts
const sign = ...

const api: OracleEndpointApi = {
    requestNewCapability: async function (question: string): Promise<OracleCapability> {
        if (possibleToAdd) {
            return newCapability
        }
        throw 'cannot'
    },
    requestCommitment: async function (req: FactRequest): Promise<Commitment> {
        if (!canCommit(req)) {
            throw 'sorry!'
        }

        const commitment: Commitment = {
            req: req,
            contract: generateSLA(req),
            oracleSig: ''
        }

        const sign = signerFactory()

        //commit to r-value for bitcoin DLC
        commitment.rValueSchnorrHex = await sign([commitment, "!RVALUE"])

        // sign commitment
        commitment.oracleSig = await sign([commitment, ""])
        return commitment
    },
    requestFact: async function (req: Commitment): Promise<Fact> {
        const sign = signerFactory()
        const factMsg = await lookup.getFact(req.req)
        const fact: Fact = {
            factWithQuestion: factMsg,
            signatureType: 'SHA256',
            //sign fact
            signature: await sign([req, factMsg])
        }
        return fact
    }
}
```

## Oracle Endpoint MAD-slashing

`contract` field in `Commitment` is meant for providing blockchain transactions commiting to SLA.

Slashing (blockchain-ensured Service Layer Agreement) is a secondary feature in Mega, since any fault primarily hurts PoW-aquired identitites.

### Quorum Slashing
Nevertheless, we provide `src/client-api/contracts/slasher.ts` example for `generateSLA` for `contract` commitment field.
We propose pairwise quorum commitments in `slashing.ts`. In the essence they are special case of binary option. Thus we provide [BTC-DLC-based](https://adiabat.github.io/dlc.pdf) implementation for a slasher - Descreet Log Contract is perfect for binary options.

Unlike vanillabiinary call, SLA binary option would keep initial distribution of funds intact:
- if Alice puts 5 satochi into an escrow, and Bob puts 10 satochi into an escrow. Then *regardless of the outcome*, Alice gets 5 satochi and Bob gets 10 satochi.

- The trick is: in order to unlock funds, oracles either have to conspire to avoid MAD (which is possible under regular pledge scenario)
  - or they have to agree on data (pairwise).
 
 ```
 Pledge refunds: partial quorums (2 of 3) refunded partially (e.g. pledge1 and pledge2).
 Total vote: 100% refund
 full disagreement - no refund
 ```
 
> MAD-conspiracy case (multisig) can be omitted by modifying DLC logic. 
> Oracles can simply send funds into adaptor-signature-locked output, bypassing multisig.
> This, however, does not exclude side-channel conspiracy - since oracles would still be able to agree on data privately, WITHOUT sharing signatures with users.
> Thus we simply implement standard binary option DLC-contract here.

> Oracle conspiracy, with or without (regardless of) slashing, can be reported in Mega and auto-verified - through either 
>> `MissingFact` report: oracles avoided slashing through conspiracy but did not provide data
>> `FactDisagreesWithPublic` report: oracles conspired to provide wrong data


### SLA time Slashing

Another example, of where the slashing `contract` field can be useful for, is refund slashing: 

- lock pledge funds in DLC CET transaction (without DLC contract)
- allow trader to unlock such funds after timeout (HTLC)
- allow oracle to unlock with provided fact

In bitcoin, this can be achieved by adding extra timeout unlocking HTLC "sub-clause" into unlocking script of DLC CET transaction.

```ts
const script = `
OP_IF ${generateTimeLockScript(deadline)}
    ${pubkeyOracleHex}
OP_ELSE
    ${pubkeyTraderHex}
OP_ENDIF
OP_CHECKSIG
`
```

On other UtXO (or any) blockchains: 

```ts
const validate = ... || (time > slaTime && verifySignature(TRADER_PUB, TRADER_SIGNATURE))
```
