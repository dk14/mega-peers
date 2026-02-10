A p2p fact sharing network

# Mega Peers

Mega *(from מַגָע, contact)* - is a lightweight infinitely scalable decentralized data marketplace, bringing authentic observers to blockchain.

---------

## Description

Mega relies on Proof-Of-Work in order to assign identities to oracles. It models real-life aquisition of identity: though effort!

Oracle's reputation is managed as a set of verifiable proofs of malleability. Traders do some PoW (spam-protection) in order to report malicious oracle.

Everything is stored in Mega's mempoolss. No blockchain required.

---

## Docs


https://dk14.github.io/mega-peers/docs/

---------

## Tests

```
npm i c8 -g
npm run test              # protocol, coverage should be 100%
npm run it                # p2p and non-essential client APIs
npm run webtest           # web-app, non-essential
npm run webtest-it        # webrtc and matching, experimental
npm run webtest-it trace  # trace matching stdout
```

> tests should printout "OK!" or exit process with error

# Protocol

Protocol and specifications are in `src/protocol.ts` and `mega-peers-spec.yaml`. Protocol reference implementation is in `src/api.ts`. 

## Use cases
 Non-essential APIs and apps are under `src/client-api/` (oracles and traders, contracts demo), `webapp/` (p2p exchange UI), `src-web/` (matching). See [docs](https://dk14.github.io/mega-peers/docs/).
> Security. Non-essential APIs need stricter typescript flavor, testnet integration tests and security audits for crypto-mainnet uses (as well as HD-wallet support). p2p-network needs real-life performance tests for scaling.

# Code quality notes

- if you pay attention - core features are well-designed.
- other, non-essentials - no one invested in time to refactor and re-design. It's just 2 months work here.

- service architecture is well-designed. It is NOT monolitic, not tangled in dependencies. Docs have diagrams - if you look for it.
- I did not split components into several repos - because party declined investing into it.
- It gets complex around cryptography because it should.

- Frameworks (for unit tests, UI, React etc) would not give any actual advantage: IoC is just a pattern. This my position here, not party - party did not care.

- For the complexity of this product - the result is better than what teamwork tasked with same problem would output. I engineered for decade, seen things.
- Don't forget: this is novel solution supporting something often thought impossible: Full and secure BTC contracts of any complexity, purely trust-less oracless.
- It is a result of long-term research in Bitcoin.

- I kept many files in root - I know that.
- I did not clean up - because was not paid to do so. I warned the party aboput consequences repeatedly.
- Invest proper funds - you'll get clean code and repo.

- I ignored commit messages and many practices - to prevent party from integrating with this product. 
- Since party ignored Wolfram stuff and wanted boxing matches stats to be here. Boxing is gay. Play football.

- If you think dirty code makes dev dirty - you superstitious :). It developes immune system.

Give me money - I'll refactor it. Money is cure!
