
> Experimental

Discreet🌿 eDSL is a fiancial contract language compatible with Mega offers, matching, and bitcoin testnet:

```
Discreet Typescript Code 
-> OfferModel 
-> OfferTerms 
-> Matching 
-> Tracking 
-> Blockchain Interpreter (Bitcoin or custom chain)
-> Chain Transactions
```

> "Discreet" misspelled on purpose

Discreet🌿 outputs `OfferModel`, which matching engine turns into `OfferTerms`. 

The language🌿 is super-easy and embedded into TypeScript.

Discreet🌿 is rooted in modern quantitative finance and renders to a tree of binary options, thus allowing expression of **arbitrary financial contracts**.

Discreet🌿 is typesafe. It provides checks and restrictions allowing traders to eliminate known types of redundancies in contracts ("perfect hedges"), thus maximising trading liquidity💦. You only collaterise💰 what's necceessary for sufficiency.


## Example
```ts
import { Dsl } from '@dk14/mega-peers/discreet'

const maxBudgetAlice = 300
const maxBudgetBob = 300
const b = 30
const model = await (new Dsl(async dsl => {
    const a = 30 + b
    if (dsl.outcome("really?", ["YES"], ["NO"])) {
        dsl.pay(Dsl.Bob, a + 100) 
        if (dsl.outcome("is it?", ["YES"], ["NO", "3..40"])) {
            dsl.pay(Dsl.Alice, 40) // if YES
        } else {
            dsl.pay(Dsl.Bob, 50) // if NO or 5
        } 
    } else {
        dsl.pay(Dsl.Alice, 20)
    }
})).enumerateWithBound(maxBudgetAlice, maxBudgetBob)
console.log(model)

```
Output:

```ts
{
    "id": "",
    "bet": [160, 20],
    "betOn": false,
    "oracles": [{"capabilityPub": "really?", "params": {}}],
    "question": "",
    "status": "matching",
    "blockchain": "",
    "role": "initiator",
    "yesOutcomes": ["YES"],
    "noOutcomes": ["NO"],
    "ifPartyWins": {
        "id": "",
        "bet": [50, 40],
        "betOn": true,
        "oracles": [{"capabilityPub": "is it?", "params": {}}],
        "question": "",
        "status": "matching",
        "blockchain": "",
        "role": "initiator",
        "yesOutcomes": ["YES"],
        "noOutcomes": ["3..40", "NO"]
    }
}
```

Discreet🌿's streamed transpiler's output (`OfferModel`) allows for final evaluations of collaterals. 

> Matching has `evaluatePartyCollateral`, `evaluateCounterPartyCollateral` functions for introspection. Broadcasting `OfferModel` would automatically evaluate those.

Collaterals are amounts 💰 needed to support your belief about upcoming outcome of certain event, support the answer you expect to be true. Each person is unique, everyone has their own expectations about environent. Collateral 💰 is the potential energy needed to express such expectation. Discreet evaluates amount of energy needed.

> **Evaluations, NOT estimations!**. Discreet relies on **nondeterministic praxeological tautology** - everything is known, nothing left to meaningless statistical speculation. You don't know the outcome - that's where the risk comes from, NOT from DSL. You supposed to predict outcome yourself, not hope for it based on "statistical" positive re-inforcement (e.g. confidence intervals). Otherwise it's gambling with statistical buzzwords.

> **Computational finance. If computer cannot enumerate portfolio - surely human won't be able to do it either**. Pricing must be done over definite outcomes. Even blurry pricing (dream-pricing) is definite pricing done on GPU (with parallelization), it is still strongly-typed. Forecasters like Random-walk, ARIMA etc hide types from you, causing confusion over what is actually priced. They also don't account for present - they infer "types" (what outcome can be) from a sample of badly collected historical data, never asking trader what the trader (human) actually knows about **present** environment. Feeding the past into the future until future becomes the past and so on, it's a perpetual motion attempt.


P.S. If comments and sections [disturb](https://en.wikipedia.org/wiki/David_Draiman) you - you don't have to read everything, no one can know everything. Everyone has their own limits (at `t`). Don't let technical specifications control your life!

> Take a moment to observe your state in here and now! What u think as past and other places is mostly in ur 🧠, just sunspots, past is already gone. The actual present is in ur 웃. Even what u see is mostly tension in your 👁💪. Look for blind spots, secrets hidden in your present environment.

And when you ready - just take the risk and play with Discreet🌿 eDSL!

<div id="container" style="width:100%;height:30vh;border:1px solid grey"></div>
<div id="container2" style="width:100%;height:30vh;border:1px solid grey"></div>
<input type="text" maxlength="60" id="parties" value="alice,bob"/> bounds:
<input type="text" maxlength="60" id="budgets" value="1000:1000"/>

> update the page if tryout didn't start


## Guarantees
- money preservation: all outputs of transaction equal sum of all inputs
    - judgemental gurantee by design - Mega `OfferTerms` does not require money inputs to be specified - they are calculated automatically.
    - `OfferTerms` has `partyCompositeCollateralAmount`, `counterpartyCompositeCollateralAmount` fields that allow to auto-refund if collateral remained in a leaf. Fully tractable spending.
- finite and predictable execution time. 
    - > Longest chain of `dsl.outcome` is the worst-case amount of transactions necessary


## Language

There are only two constructs👷:
- checking observations 👁 - inputs from oracles (`dsl.outcome` returns `boolean`, true or false)
- paying 💳 (`dsl.pay`)

Everything else you can do in javascript.

> Maintaing and progressing state is done in TypeScript with arbitrary computation available. You can calculate amount of paid output based on observation and any data known prior to offer submission. Any formula, any logic.

### ⌫ Erasures

DSL🌿 transpiler will erase javascript code, collapsing it into `observe -> pay -> ... -> observe -> pay` chains. If rendered to Bitcoin DLC - it makes contract logic 100% private - only paid amounts are visible on-chain, not **why** they paid.

Your thoughts💭 are kept secret.

> For other chains - worst-case scenario will expose oracle messages/signatures and corresponding paid amounts. The calculation logic is erased nevertheless.

No smart-contract/VM is required to run the resulting contract. Target chain only has to be able to understand scriptless scripts (support Schnorr), which most modern chains do. 

> *Non-utxo  chains (and smart-contract chains in general) are NOT recommended, since they create expensive redundancies by making their nodes compute unlocking-logic that is NOT supposed to be on-chain. The code our transpiler erases is literally "smart"-contract code. The state our transpiler erases is Cardano's datum.*

### ⛓ Limitations

Capturing variables is unsafe outside of dsl-context

Instead of this:
```ts
var a = 30
const model = await (new Dsl(async dsl => {
    if (dsl.outcome("really?", ["YES"], ["NO"])) {
        a++
        dsl.pay(Dsl.Bob, a + 100) 
    } else {
        dsl.pay(Dsl.Alice, 20)
    }
})).enumerateWithBound(maxBudget1, maxBudget2)
```

Use this:
```ts
const model = await (new Dsl(async dsl => {
    var a = 30
    if (dsl.outcome("really?", ["YES"], ["NO"])) {
        a++
        dsl.pay(Dsl.Bob, a + 100) 
    } else {
        dsl.pay(Dsl.Alice, 20)
    }
})).enumerateWithBound(maxBudget1, maxBudget2)
```
Or don't - there is always choice 🤷.

----

Consequently, services queryed in dsl-context must be idempotent (e.g. stateless GET, not PUT). 

Instead of that:
```ts
const model = await (new Dsl(async dsl => {
    var a = 30 
    const b = await database.get("b")
    if (dsl.outcome("really?", ["YES"], ["NO"])) {
        a++
        dsl.pay(Dsl.Bob, a + 100 + b) 
    } else {
        dsl.pay(Dsl.Alice, 20)
    }
    await database.push("a", a) // cannot!
})).enumerateWithBound(maxBudget1, maxBudget2)
```

Use that:

```ts
const a_nondeterministic = []
const model = await (new Dsl(async dsl => {
    var a = 30
    const b = await database.get("b")
    if (dsl.outcome("really?", ["YES"], ["NO"])) {
        a++
        dsl.pay(Dsl.Bob, a + 100 + b) 
    } else {
        dsl.pay(Dsl.Alice, 20)
    }
    a_nondeterministic.push(a)
})).enumerateWithBound(maxBudget1, maxBudget2)

await database.push("a", a_nondeterministic) //[30, 31]
```

Or don't - up to u 🤷.

> Discreet🌿 enumerates all possible meaningful outcomes by design - so types of outcomes in contracts have to be chosen carefully - they have to be human-interpretable, meaningful. Even if it's DOJ-index - you have to pick the ranges of values with meaning. 

> Ranges are allowed - 0..100 is a single outcome. Numerics on observed data (multiplications, sum) however would still require larger (but not full) enumeration. E.g. you can even "0..5", "5..10" on interest rate and then multiply, sum, recurse on it.

> It is a small overhead even for complex scheduled contracts as it runs out. You can safely enumerate a hundred of states of a single ticker for precision. Even a schedule, with reasonable amount of events - does not blow that much exponentially. Exponents tend to lift off slowly like an airplane.

> We really discourage large contracts on Discreet, but they are quite possible nevertheless.

### 🚫 Perfect Hedge anti-pattern
> note: while there is a trivial algorithm to convert inoptimal contract to the optimal one, it cannot be applied in practice. It would not express what YOU meant, your subvocal speech, your "self", your personality.

Benefiting regardless of outcome is a result of overcollaterization. If Alice wins either 40 or 50 - there is no point betting more than 10. Otherwise she would lock 40 sats for no reason 🤷.
```ts
if (dsl.outcome("really?", ["YES"], ["NO"])) {
    // Alice gets paid regardless of outcome:
    dsl.pay(Dsl.Alice, 40) 
} else {
    // Alice gets paid regardless of outcome:
    dsl.pay(Dsl.Alice, 50) 
} 
```
>^ this will throw a "Perfect Hedge" error. No way around it.

Proper contract:

```ts
if (dsl.outcome("really?", ["YES"], ["NO"])) {
} else {
    dsl.pay(Dsl.Alice, 10)
} 
```
...yields same profit.

Now Alice has extra 40 satochi to buy coffee today, rather than in uncertain future.


### 👁 Outcomes

Same question cannot be quryed more than once.

All outcomes specified in either yes or no of `dsl.outcome(pubkey, yesoutcomes, nooutcomes`) must have distinct semantics. Otherwise typesafety of "not querying the same outcome twice" would be broken. 

> Breaking semantics of outcomes would allow Alice to bypass "perfect hedge" restriction with double-nested `if`. 

> For outcomes in mutually-exclusive relation - we provide `dsl.set` as a wrapper around binary outcomes. It allows expressing any operation on sets.

Querying mutually exclusive outcomes directly, e.g. `{yes = ["a"], no = ["b"]} && {yes = ["b"], no = ["a"]}` disallowed, since it can potentially output unreachable subcontracts: use typescript's NOT (`!`) on captured outcome instead, so typescript could lint unreachable code.

> Requirements on observations can be even stronger: `dsl.superMode = true` would allow re-use of same pub ONLY if `args` are different. `dsl.megaMode` would disallow re-use of same oracle completely. It indirectly disables intuinistic `numeric`s and `set`s, leaving pure binary judgements over types (true sets). The only loophole it leaves is soundness itself (e.g. two oracles might be answering same question). 

P.S. There is always `dsl.unsafe.outcome` if all this stresses you out.

#### 🤔 Script-generated observations (advanced)
> u can skip this...

`pubkey` is allowed to contain chain-specific script, if specific algorithmic verification of the fact is required, rather than just verification of signature from third-party attestant. It is needed in order to use cryptological proofs as true oracles. Convention: `$(<extra validator script>)`. Examples:

- timelock: `$(OP_CHECKLOCKTIMEVERIFY <time> )`
- hashlock: `$(OP_SHA256 OP_EQUALS <locking-nonce> OP_VERIFY)`
- merkle-tree for complex locking: `$(OP_CAT OP_SHA256 ...)` ([this](https://blog.blockstream.com/en-treesignatures/)), 

Bitcoin Script is taken as a standard for cross-chain compatibility, since Bitcoin Script is complete, compact, secure and non-redundand. There are already [eDSLs](https://scryptplatform.medium.com/introducing-scryptts-write-bitcoin-smart-contracts-in-typescript-e59845213fbc) to output such scripts.

> bitcoin chain interpreter would be required to concatenate a script checking party/counterparty signature with the extra script provided. Privacy note: logic of lock-conditions will be revealed to the public in case if counter-party becomes malicious.

> other chains (Utxo/NonUtxo alike) would have to translate Bitcoin Script into expressions of the form of a predicate: `$(time < 10000 && sha256(param1) === '<hash>' && account(<address>).value > 30) && <account_address>.in(<merkle_tree>)` and must throw an error (in so called smart-contract) if expression fails. *We discourage using their implementations of accounts and merkle-trees and such though. After seeing some of the issues on their githubs and them trying to explain to each other like crypto like something speculating on what double-preimage attack is, what friendship is and much and such.*

> be aware of double-preimage attacks on Merkle-trees. Double-hash or use incompatible hashes for leafs. Make sure trees are balanced.


This approach additionally allows for purely trustless Mega-Duel mode: Bitcoin script can verify PoW done over oracle's PubKey. In absense of suitable oracle in Mega-mempools, Alice and Bob  (contract participants) can be lightweight "oracles" themselves and engage in PoW-battle⚔️ in case of a dispute. 

> as long as they both pre-agreed on PoW-threshold before signing transactions.

### 〇 State

Discreet🌿 is at least as powerful 💪 as [Cardano Marlowe](https://marlowe.iohk.io/). It allows stateful contracts.

Consequently, schedules, every collaterizable [ACTUS](https://www.actusfrf.org/)/[ISDA](https://www.isda.org/) instrument can be implemented in Discreet🌿.

> Investment banking can be stressful, but stress is just "involutary" contraction of muscles. Awareness  and responsibility gives you back your control, nothing is truly "involutary". What you think of as headache is just pressure from your cranial muscles.

### ∞ Recursion

Discreet🌿 allows for recursion. `outcome` and `pay` can be in recursive calls as well, but subject to Discreet🌿 typesafety: no "perfect hedges".

Every contract has a limit on maximum collateral (`enumerateWithBound(maxBudgetParty, maxBudgetCounterParty)`), thus payout recursion is bounded. 

Halting problem is semi-solved here.


<canvas id="canvas">
Your browser does not support the canvas tag.
</canvas>

> General termination oracles (in CS) while actually exist under proper formulations, are not applicable here. We focus on interpretability of a contract, since contracts are always budget bound. Contracts aim at commitment of existing resource (at risk), needed in order to aquire new resources (eg to run a Turing machine solver longer).

### 👭 Multi-party

Multi-party mode creates a set of mutual 2-party contracts. The contracts themselves are incapsulated, all pairs are treated as one contract in eDSL.

> U don't have to think 🤔

```ts
import { Dsl } from '@dk14/mega-peers/discreet'

const multi = await (new Dsl (async dsl => {
    if (dsl.outcome("really?", ["YES"], ["NO"])) {
        dsl.party("alice").pays("bob").amount(100)
        dsl.party("bob").pays("carol").amount(20)
    } else {
        dsl.party("carol").pays("alice").amount(40)
        dsl.party("bob").pays("alice").amount(40)
    }
})).multiple("alice", "bob", "carol").enumerateWithBoundMulti(([[1000, 2000], [1000, 2000], [1000, 2000]]))
```

#### 🤔 Ad-hoc parties (advanced)
> u can skip this...

Adding a new party "on the go" is equivalent to early-termination of a contract. As far as blockchain security concerned - terms have to be re-negotiated from scratch. There is no need to put participant management logic on-chain.

Meantime, off-chain code can benefit from the use of factories:

```ts
import { Dsl } from '@dk14/mega-peers/discreet'

//assume contributors collateral in btc, beneficiary collateral is in assets
const fundFactory = (accumulatedFund: number, refillFund: number, refillBeneficiaryCollateral: number, contributors: string[], beneficiaries: string[], lock: string) => {
    // beneficiaries and contributors are required to be unique in Discreet. 
    // Effectively might not be so, unless you match through Mega-P2P-offers with high PoW-threshold on the offer message itself.
    return await (new Dsl (async dsl => {
        if (dsl.outcome("payout allowed?", ["YES"], ["NO"])) { //beneficiary completed project
            contributors.forEach((contributor, i) => {
                dsl.party(contributor).pays(beneficiaries[i]).amount(refillFund / contributors.length)
            })
        } else if (dsl.outcome("refund?", ["YES"], ["NO"])) { //beneficiary failed/rejected project
            contributors.forEach((contributor, i) => {
                dsl.party(beneficiaries[i]).pays(contributor).amount(refillBeneficiaryCollateral / beneficiaries.length)
            })
        } else {
            //suspend fund; send to `accumulatedFund` multisig for consensus
            contributors.forEach((contributor, i) => {
                dsl.party(contributor).pays(lock).amount(refillFund / contributors.length)
                dsl.party(beneficiaries[i]).pays(lock).amount(refillBeneficiaryCollateral / beneficiaries.length)
            })
        }
    })).multiple(contributors.append(beneficiaries))
    .enumerateWithBoundMulti(Array(100).fill(Array(2).fill(accumulatedFund + refillFund + refillContributorCollateral))) 
    
    // ^ that is how central banking collaterizes everything, easy to overcollaterize a deal when "collaterals" are double-counted already. Under-over-collaterization.
}
```
> Note: This is made up soso example for legacy funds (e.g. hedge funds), to learn from their mistakes. Mega encourages safe tractable funding, where the only risk is the outcome itself (project completed or not), rather than uninterpretable alienated complexity of The Fund. Thus connections have to be tractable, either: one beneficiary, possibly several contributors. Or: one contributor, possibly several beneficiaries. 

> Not many to many. Many-to-many (p2p) forms naturally in the market, **individual deals are naturally !!ONE-to-possibly-many!!**. Contracts are written by individuals, not the "market itself", e.g. internet does not tell you what to do, you connect to internet and decide. Take active role, reach out to environment, lol!

> Oraacle queries: for sake of both interpretability and freedom from oracle's supervision, it is strongly recommended to not tie the query to the "contract" semantically, e.g. it should not be "payout allowed?", it should be "street is cleaner?"... or dirtier whatever preference. 

> Exercise: enjoy rewriting this fund into 1-to-1 deal between you and the actual contributor, rather than an abstract beneficiary.

#### ⏰💦 Early termination

As mentioned above, early termination is as good as sending remaining funds to either party/parties (unilateral) or multisig account (bilateral), no reason to continue after that. For the latter special syntax sugar is provided:

```ts
party("alice").pays(Dsl.mutual("alice", "bob")).amount(100)
party("bob").pays(Dsl.mutual("alice", "bob")).amount(10)
```
In case if early termination has to be authorized by third-party, third-party becomes an "oracle":

```ts
if (dsl.bool.safe.outcome("carol authorized?", "yes", "no"))){
    party("alice").pays(Dsl.refund("alice")).amount(100)
    party("bob").pays(Dsl.refund("bob")).amount(10) 
    return dsl.infinity.stop   
} else {
    return dsl.infinity.move(newstate)
}
```
> there is no common sense reason to let a particular third-party (e.g. government) authorize your deal, unless carol takes part in the contract herself (locking conditions within multi-party contract, which itself likely come from miscalculations too). 

> Proper oracles and proper conditions should be used instead, e.g. "earthquake detected?". Mega itself is more reliable attestant than government agency, or even corporate.

### 🚗 Cross-currency (assets)

DSL🌿 should not be responsible for asset pairs ₿🪙, since asset pair is assumed to be fixed between parties per (composite) contract - you specify asset pair in matching etc. Allowing one party to have several assets in a contract is equivalent to having several parties, e.g. "alice-usd", "alice-btc".

> Note: since Discreet relies on binary options - there is no confusion about currency. In "alice-usd", "bob-btc" pair - Alice always gets btc, Bob always gets usd.

> no consfusion...

```ts
account.party("alice_usd").pays("bob_btc").amount(1000000000) //1000000000 usd
account.party("bob_btc").pays("alice_usd").amount(10) //10 btc
```

There is, however syntax sugar to ensure proper currency is used in multi-party contracts:

```ts
const assets = await (new Dsl (async dsl => {
    if (dsl.outcome("ready? go?", ["YES"], ["NO"])) {
        dsl.party("alice", "usd").pays("bob", "btc").amount(10000000, "usd")
    } else {
        dsl.party("bob", "btc").pays("alice", "usd").amount(10, "btc")
    }
})).multiple(Dsl.account("alice", "usd"), Dsl.account("bob", "btc")).enumerateWithBoundMulti([[500000000, 50000000]])
```
> **^This is NOT atomic swap**. Atomic swaps are transactions - not contracts, they execute unconditionally.

#### ＄🚗 Atomic Swap

This one IS:

```ts
const swap = await (new Dsl (async dsl => {
    const allowSwaps = true
    dsl.if("TRUTH", ["true"], ["true"], {}, allowSwaps).then(pay => {
        pay.party("alice", "usd").pays("bob", "btc").amount(10000000, "usd")
    }).else(pay => {
        pay.party("bob", "btc").pays("alice", "usd").amount(10, "btc")
    })
})).multiple(Dsl.account("alice", "usd"), Dsl.account("bob", "btc")).enumerateWithBoundMulti([[500000000, 50000000]])
```

Shortcut:

```ts
dsl.atomicSwap.ifTruth("lock1", "allowed").then(pay => {
    pay.party("alice", "usd").pays("bob", "btc").amount(10000000, "usd")
}).else(pay => {
    pay.party("bob", "btc").pays("alice", "usd").amount(10, "btc")
})
```

> DSL allows obvious contradiction as a hack in cross-currency, if you specify `allowSwaps`. Otherwise contradictions are checked. Discreet also verifies wether it is actually cross-currency. Swaps usd for usd won't work even if `allowSwaps` is enabled.

> Interpreter must understand your swap-lock conditions: it could be oracle allowing swap ("PTLC-lock" in BTC), or as in case with crypto-loans, it could be hash-lock conditon for signing atomicity, or just "true" if `OfferTerms` interpreter can optimize it (see Contracts doc).

> Party role reversal (negative amounts) is disabled for cross-currency. There is a semantical check: "minus 5 dollar does not imply plus 5 btc".
> > Swapping same asset is disabled. It is disabled only if one of the parties pays. Using `dsl.atomicSwap.ifTruth` for multi-party swap is allowed even some parties in a contract are same-asset, given that they don't participate in a particular swap.

> "Perfect hedge" check is NOT bypassed here. Discreet still prevents you from swapping funds with yourself. Only semantics of observation are bypassed, since both branches have to be executed simulteniously when condition is unlocked. 


> Not to be confused with a lock-check - locks can be checked with regular `dsl.if("lock", ["true"], ["false"])` rather than `dsl.if("lock", ["true"], ["true"])` (this specifically means atomic swap).

#### 🏦 Payment At Maturity (crypto-loan)

```ts
// Borrowing contract

dsl.atomicSwap.ifTruth("hashlock", "verified").then(ctx => {
    ctx.party("alice", "usd").pays("bob", "btc").amount(10000000, "usd") //alice lends bob money
}).else(ctx => {
    dsl.if("liquidation?", ["yes"], ["no"]).then(ctx => { //price oracle
        ctx.party("bob", "btc").pays("alice", "usd").amount(10, "btc")
    }).else(_ => {
        dsl.if("timelock", ["yes"], ["no"]).then(ctx => { 
            ctx.party("bob", "usd").pays("alice", "usd").amount(300, "usd") // interest 
            dsl.if("alice receiving wallet empty", ["yes"], ["no"], {}).then(ctx => {
               ctx.party("bob", "btc").pays("alice", "usd").amount(10, "btc")
            }).else(_ => {
                // graceful termination
            })
        })
    })
})

// repayment (this is separate contract - can be submitted any time when bob gets funds, but before "timelock")

if(outcome("timelock", ["yes"], ["no"])) {
    //too late to pay - Bob loooses deposit
} else {
    dsl.party("bob", "usd").pays(party("alice repayment"), "usd").amount(10000000, "usd") 
}
```

> Note: OP_ANYPREVOUT would remove a need for third-party Oracle - Bob's repayment could be attached as one of the inputs.

> Unlike with account-based chains - this approach keeps "logic of checking payment proofs" private.

> The restriction requiring third-party oracles only applies to BTC-to-asset loan. Any other loan on Bitcoin blockchain, asset-to-asset, would rely on overlay blockchain (in OP_RETURN), thus advanced spending rules can be implemented (by issuers of corresponding assets) including OP_ANYPREVOUT, covenants and such without need to change anything about BTC protocol (can create a whole chain of one single anyone-can-spend satochi traveling around btc blockchain) and without loss of privacy. Thus, no need for third-party oracle to watch payment wallets.

> It is also possible to peg BTC currency itself to a securitized BTC-A asset running in overlay (e.g. ordinals), since atomic swaps between BTC and assets are possible. To not repeat USDT and CFD (contract for difference) mistakes - one has to remember that pegging is equivalent to issuing a new asset thus such BTC-A would increase supply of overall BTC if it's liquid enough. So atomic swaps can only be allowed between "newly issued BTC-A" and BTC going to void. Unlike with side-chains - here swaps would happen on the same chain (between overlay of BTC and actual BTC) and you can swap with yourself (no need to trade): "burned 0.1 BTC for 1 satochi representing 0.1 BTC as 0.1 BTC-A asset", but only in one direction, swapping it back would require counterparty (would be at premium).
                
This loan is "physically-settled" vanilla option - Bob buys an option to swap his deposit for usd.

----

There is a tricky niche way to implement "proof of not receiving money" on pure btc:
```ts
if (observe("alicePubkey", ["ADDRESS IS EMPTY"])) {
    ...
}
```
> This is "proof of empty address". If alice signs such "ADDRESS IS EMPTY" message as an "oracle" - she would reveal private key to her repayment wallet (where grace-period locked funds of Bob are supposed to be present) to the public on-chain, since signature and private key would be same (alice derives pubkey for wallet from signature of "ADDRESS IS EMPTY" itself, interpreting her own signature as a secret key). Thus Alice would burn the address.

> It does not stop Alice from slashing/rejecting received payment from Bob this way - it only proves that Alice did not receive anything. It is an option for Alice to choose between accepting incoming payment and unlocking security deposit. She would have to add her own deposit to repayment wallet MAD-style as incentive to not reject someone's payment. So applicability of this approach in actual loans is quite limited, it only works for deposits with uncertain value - otherwise it is simply equivalent to overcollaterization (for alice's security deposit - she would ask higher deposit from Bob, which would erase original incentive).

#### ⏰ Vanilla Future Contract
Vanilla futures are impossible on blockchain. Such contracts are not automatable, since either of the party might not have funds in the future, thus no way to collaterize in advance. Vanilla future is symmetric, unlike crypto-loan.

> Defi "solves" it with tokens, but tokens are not backed up by anything. You cannot tokenize a car or a human. Alice cannot go and tatoo a **unique** pubkey on a car or her body. Carol will take up on a trend and everyone will have same tatoo like idiots.

```ts
const mafiaIncentive = {value: 100, asset: "satochi"}
const mafiaDeposit = {value: 300, asset: "satochi"}

if (dsl.outcome("bob and alice create an atomic swap on date $date", ["yes"], ["no"], {date: "next month"}) {
    dsl.party("alice", mafiaIncentive.asset)
        .pays("mafia", mafiaIncentive.asset)
        .amount(mafiaIncentive.value, mafiaIncentive.asset)

    dsl.party("bob", mafiaIncentive.asset)
        .pays("mafia", mafiaIncentive.asset)
        .amount(mafiaIncentive.value, mafiaIncentive.asset)
} else {
    //this assures Bob and Alice that mafia is committed to its job
    dsl.party("mafia", mafiaDeposit.asset)
        .pays("alice", mafiaDeposit.asset)
        .amount(mafiaDeposit.value / 2, mafiaDeposit.asset) 
        //or to void, so there would be no conspiracy

    dsl.party("mafia", mafiaDeposit.asset)
        .pays("bob", mafiaDeposit.asset)
        .amount(mafiaDeposit.value / 2, mafiaDeposit.asset)
}
// suddenly...out of nowhere...
```

> This contract can be repurposed as a security deposit for vanilla [IRL](https://en.wikipedia.org/wiki/In_Real_Life) loan. Just add extra "lending" payout from Bob to Alice (or mafia to Alice). Then future one-sided "swap" would be paying it back (in exchange for satisfying [mafia](https://en.wikipedia.org/wiki/The_Sopranos) with payout of incentive). 

> Many IRL financial instruments are possible with this approach, as long as mafia has PoW-issued id to not let mafia conspire with either party, or become lazy. In order to ackuire such id, mafia can become special Mega-oracle. As Mega-oracle mafia would only have a single possible outcome to attest to, and would only be able to answer very specific questions. Mafia would be accountable since PoW-reports can be filed against it.


### ☢ Mutually Assured Destruction (MAD)

Alice and Bob - can be each other's mafia themselves. MAD-contract can simply reward them back their "secure future" deposits as a reward for fulfilling commitment to a mutual agreement.

```ts
if (dsl.outcome("siglock_alice && siglock_bob && timelock $date", ["yes"], ["no"], {date: "next month"}) {
    dsl.party("alice", asset1)
        .pays("alice_future", asset1)
        .amount(deposit, asset1)

    dsl.party("bob", asset2)
        .pays("bob_future", asset2)
        .amount(deposit, asset2)
} else { //send to void; needed in case auto-refunds enabled
    dsl.party("alice", asset1)
        .pays("ע", asset1)
        .amount(deposit, asset1)

    dsl.party("bob", asset2)
        .pays("ע", asset2)
        .amount(deposit, asset2)
}
```

### 🔢 Numeric observations

Outcomes are binary in Discreet🌿, so interest rate drivers and such have to be enumerated and adapted. We recommend to quantize derivatives manually - to give meaning to numbers.

If numbers are still preferred:

```ts
const lowerBound = 0
const upperBound = 5
dsl.unsafe.numeric.outcome("price?", lowerBound, upperBound).evaluate(n => {
    dsl.pay(Dsl.Alice, n + 1)
})
```

> Example above is a perfect hedge on its own - you'll most likely (but not necesseraly) have to match values of `n` individually in order to keep deal balanced between parties. This can be avoided by using `dsl.unsafe.numeric`, which redefines semantics of numbers to align with human flawed intuition.

> More strict semantics of observation - can be achieved by using `dsl.strictlyFair = true` (see technical notes). The strictest option is `dsl.strictlyFair = true && dsl.StrictlyStrict = true` which disallows any complex condition.

> `dsl.strictlyOneLeafPays` and `dsl.strictlyOneLeafPairPays` allow to ensure that payment only happens in a single leaf of a tree. `strictlyOneLeafPairPays` is weaker and allows one leaf per party (strictest perfect hedge check on numbers).

> `dsl.safeMode = true` would disable all calls to `numeric.unsafe`

Safe version:

```ts
const lowerBound = 0
const upperBound = 5
dsl.numeric.outcome("price?", lowerBound, upperBound).evaluate(n => {
    if (n > 2) {
        dsl.pay(Dsl.Alice, n + 1)
    }
})
```


For cats and niños:
```ts
const num = dsl.numeric.safe.outcome("3 or 5?", 3, 5)
if (num === 3) {
    ...
} else { // 5
    ...
}
```

Multi-party:

```ts
const step = 1
dsl.numeric.outcome("price?", 0, 5, step).evaluateWithPaymentCtx((account, price) => {
    account.party("alice").pays("carol").amount(price - 2)
})
```

#### 📞 European Call

"cash"-settlement:
```ts
dsl.numeric.outcome("price?", 0, 5, step).evaluateWithPaymentCtx((ctx, price) => {
    const envelope = Math.max(-100, Math.min(100, price - base))
    ctx.party("alice").pays("bob").amount(envelope * leverage)
})
```
> While European Call as such is not over-collaterazied, portfolios of european calls betting on the same observation - can easily form pathological instrument. Especially where assets are pooled together - one decision maker (e.g. treasurer, monarch, dictator, therapist/rabbi, guru, messiah, or even as in case with DeFi: self-contradictory fantasy algorithm) effectively becomes a single party "benefiting regardless of outcome", together with his people (unless, let's say military dictator with a sense of humour is using our eDSL).
>>binary option is the only instrument practically free of misuse.

#### ⇌ Quantized Vanilla Interest Rate Swap

```ts
const dates = ["today", "tomorrow", "next week", "next month"]
const capitalisationDates = new Set(["next week"])
const notional = 10000
// fixedRate and range of floating rate have to be tuned - a quantitative riddle...enjoy...
const floatingLegIndex = "interest rate index?"
const fixedRate = 3 
const quantisationStep = 1

dates.reduce(([capitalisation1, capitalisation2], date) => {
    const [floatingRate, accounts] = dsl.numeric
        .outcome(floatingLegIndex, 0, 5, quantisationStep, {date})
        .valueWithPaymentCtxUnsafe() //"unsafe" requires manual release in order to payout

    if (capitalisationDates.has(date)) {
        const floatingPayout = (notional + capitalisation1) * (floatingRate / 100) 
        const fixedPayout = (notional + capitalisation2) * (fixedRate / 100)
        accounts.party("alice").pays("bob").amount(floatingPayout)
        accounts.party("bob").pays("alice").amount(fixedPayout)
        accounts.release()
        return [0, 0]
    } else {
        accounts.release()  // resources are checked; reference counter would throw an error without this
        return [
            notional * (floatingRate / 100) + capitalisation1, 
            notional * (fixedRate / 100) + capitalisation2
        ]
    }
}, [0,0])

```
> warning for FP-enthusiasts: wrapping `release` with monads (`Cont` including) is not practically applicable here. You'll get a combination of `Either` and `Writer`/`State` - they're not composable, they would just spread type-perturbation around. KISS. 

> `valueWithPaymentCtxUnsafe` is meant to (optionally) avoid contextual continuations. Pure functional way would be to just use `.evaluateWithPaymentCtx((value, context) => {...})` continuation  twice (one in `then`, the other in `else`). But since, resources are checked automatically, above representation is simply more compact, efficient and still reasonably safe - mispositioning `release` would delay payout simply (and only possible with `dsl.unsafe.numeric` which we don't use here).


#### ⇌ "Perpetual" Interest Rate Swap

```ts
const collateralAlice = 10000
const collateralBob = 10000
const startDate = 1

const multicontract = new Dsl(dsl => {

    const floatingLegIndex = "interest rate index?"
    const fixedRate = 3
    const quantisationStep = 1

    //throws `DslErrors.InifinityError`
    dsl.numeric.infinity.bounded(100000).progress(startDate)
        .perpetual([collateralAlice, collateralBob], (date, [notionalAlice, notionalBob]) => {

        const floatingRate = dsl.numeric
            .outcome(floatingLegIndex, 0, 5, quantisationStep, {date})
            .value() //just value - since payouts are unconditional without capitalisation schedule

        const floatingPayout = notionalAlice * (floatingRate / 100) 
        const fixedPayout = notionalBob * (fixedRate / 100)

        notionalAlice -= fixedPayout
        notionalBob -= floatingPayout

        if (notionalAlice > 0) {
            dsl.party("bob").pays("alice").amount(fixedPayout)
        } else {
            dsl.party("bob").pays("alice").amount(notionalAlice + fixedPayout) //`a - b + b = a` must hold for it to work
        }

        if (notionalBob > 0) {
            dsl.party("alice").pays("bob").amount(floatingPayout)
        } else {
            dsl.party("alice").pays("bob").amount(notionalBob + floatingPayout) //`a - b + b = a` must hold for it to work
        } 
        
        if (notionalAlice < 0 || notionalBob < 0) {
            return dsl.infinity.stop
        } else {
            return dsl.infinity.move([notionalAlice, notionalBob])
        }          
    })
}).multi("alice", "bob")
.enumerateWithBoundMulti([[collateralAlice, collateralBob]])

const contract = (await multicontract)[0][3] //extract from multi-contract; although multi is unnecessary for 2-party

assert(collateralAlice === evaluatePartyCollateral(contract))
assert(collateralBob === evaluateCounterpartyCollateral(contract))
//^ might not hold precisely - see comments
```

Certain values of floating rate will create a perfect-hedge - these values must be excluded from the type (`dsl.set` should be preferred to `dsl.numeric`), so contract can be priced properly. Another, unsafe, option would be to "automate" pricing:

```ts
try {
    dsl.party("alice").pays("bob").amount(floatingPayout)
} catch (e) {
    if (e instanceof DslErrors.PerfectHedgeError) {
        // this will prolong lifetime of the swap!
        notionalBob += floatingPayout //put it back like never happened
        // swap reaching "Infinity" would be an "Absolute Perfect Hedge" achievement.
    }
}
```

> The swap example also shows how numeric imprecisión can get one (or even few) satochi stuck. Discreet makes it safe: if chain-interpreter supports auto-refunds - contracts auto-refund remaining collateral.

> Note: only `pay`s must be integers (they get rounded to nearest if you don't round them properly), since sats are integers. All internal computations can be done with any type of number: "real", rational, "complex", matricies, quaternions, dedekind nonsense cuts, functors, group generators, monoids/semigroups, combinatorial groups, topoi etc.

### ∩ Set observations

```ts
dsl.set.outcome("which?", ["lol", "okay", "yaay"]).evaluate(point => {
    if (point === "lol") {
        dsl.pay(Dsl.Alice, 30)
    } 
})

dsl.set.outcomeT<string>("which?", ["lol", "okay", "yaaylol"], x => x).evaluate(point => {
    if (point === "lol") {
        dsl.pay(Dsl.Alice, 30)
    } 
})
```

> strict modes for numbers, apply to sets as well 

> `dsl.set.safe` works too

#### ⇌ Quantized auction

Auction would need a predefined set of bids and maximum amount of attempts.
**It is trustless: participants themselves can be oracles.**

If participants put collateral for their bids in advance, one round:
```ts
const bids = [100, 300, 500, 1000]
const participants = ["alice", "bob", "carol"]

const oracles = {
    alice: "pub",
    bob: "pub",
    carol: "pub"
}
const round = {}
for (let party of participants) {
    const bid = dsl.set.outcomeT<number>(oracles[party], bids, x => x.toString(), x => parseInt(x)).value()
    round[party] = bid
}

const [winner, bid] = Object.entries(round).maxBy([party, bid] => bid)

dsl.atomicSwap.ifTruth().then(ctx => {
   ctx.party(winner).pays("auction", "asset").amount(bid)
}).else(pay => {
   ctx.party("auction", "asset").pays(winner).amount(1, "asset")
})

//collateral is 1000 per participant
```
> Multiple rounds - can be generalized by creating synthetic oracles for participants, e.g. "alice-round-1" etc. If alice made bet through "alice-round-1" already - she can make it for round 2 through her round-2 oracle. 

This can be improved closer to IRL by:
- allowing participants to commit collaterals only at the time of the bid
- adding oracle and mafia instead of digital assets, to make sure actual goods delivered

```ts
const receivePaymentPubKey = "<pub>"
const receivePaymentPubKeyAdapted = schnorrAdapt("<pub>", txbody) //signing with this reveals receivePaymentPubKey's private key
const round = ... //same logic

const [winner, bid] = Object.entries(round).maxBy([party, bid] => bid)

//physical delivery vanilla future contract:

dsl.outcome("timelock1") ?? return
dsl.if(receivePaymentPubKeyAdapted, ["true"], ["false"], {}).then(accounts => {
    //auction did not get payment from winner
    dsl.outcome("timelock2") ?? return
    accounts.party("mafia").pays("auction").amount(insurance) //or to void, so there would be no conspiracy
    //alternatively: close or pick next winner

}).else(accounts => {
    accounts.party("auction").pays("mafia").amount(incentive)
    dsl.if("goods delivered").then(accounts => {
        accounts.party(winner).pays("mafia").amount(incentive) 
        
    }).else(accounts => {
        accounts.party("mafia").pays(winner).amount(insurance) //or to void, so there would be no conspiracy
    })
    //alternatively: put MAD on receiving wallet, send auction's security deposit to MAD
})

```

> Auction can invalidate pre-bids with "proof of empty-pockets" (after timeout). Mafia is optional here but can improve efficiency. 

> For goods delivery: auction can simply put security deposit instead of using mafia, but evaluation of such deposits is not always available. 

> If there is no trusted oracle to check delivery - then MAD on the receiving wallet of the auction (distinct wallet per participant) plus MAD security deposit from auction.

### ❗ Assertions

To assert worst-case collaterals so far:
```ts
dsl.assert.budget(Dsl.Alice, 1000)
dsl.assert.parties("alice", "bob").budget(0 | 1, 1000)
dsl.assert.sum.budget(1000) // alice and bob
dsl.assert.sum.parties("alice", "bob").budget(1000) // per trading pair
```
> other assertions can be done by simply throwing an exception

## Algorithmic Trading

### Past 
It is possible to query extra non-oracle data-sources for past data, e.g. price history. RIght from eDSL, together with contract logic.

Such extra-sources however will only be queryed prior to submission of contract and everything would get set in stone "on-chain". Such past queries can be useful to analyze and check market data in algorithmic trading in order to automatically decide the immutable terms.

> note: backtracking does not account for novel data, so foreseeing actual events is more important

### Future
DSL🌿 enumerates all possible outcomes, thus removing the need for random walk. 

> if your strategy explodes numerically, the only thing you can do is to specify types properly, judging from immediate present sitation. Rely on ranges of possible outcomes you can yourself interpret as human and time periods you would be able to foresee yourself. 

> no one else will do it for you: human trader is a real oracle - "oracles" in contract are just attestants. Forecast like a boss.

## Technical Notes

### Typesafety

Typesafety is meant to ensure energy preservation. Historically we introduced [STLC](https://en.wikipedia.org/wiki/Simply_typed_lambda_calculus) to lambdas as a way to avoid "perpetual motion". STLC represents finite computational resources completely - any other system is a tautology of STLC. 

Here, in Discreet🌿 - we avoid perpetuality by design, since `enumerateWithBound` asks finite collaterals (bounded recursion).

For code NOT involving payments (pure functions), Typescript is responsible for safety, it would give you stackoverflow. 

Discreet🌿 additionally provides convinience sugar for pure functions that are meant to go beyound any known boundary (e.g. for precision):

```ts
const turing = (a: number) => () => {
    if (a > 5) {
        return 7
    } else {
        return Dsl.recurse
            .bounded(turing(a))
            .attempts(5)
            .otherwiseYield(50)()
    }
}

console.log(turing(8)()) // 7
console.log(turing(1)()) //50
```

#### Over-under-collaterization

Both, overcollaterization and undercollaterization can be seen as an attempt at perpetual motion. 

When unnecessary collateral is locked - trader **puts** energy from nowhere (nature is efficient, thus trader miscalculates).
It breaks conservation.

When collateral double-counted (which Bitcoin finite supply prevents in theory) - trader **takes** energy from nowhere.
It breaks conservation.

Formally, this is simply:

```ts
const n = aquireResources()
while (collateral > 0 && collateral < n) { // preservation
    collateral = trade(collateral)

    while (collateral <= 0) {
        collateral += 20 // overcollaterize
    }
    
    while (collateral > n) {
        if (loophole1) {
            collateral = n / 2 // undercollaterize
        } else {
            n = n * 2 // double-count resources
        }    
    }
    // PROFIT???
}
contactEnvironment() // neurotically unreachable
decideNextAction()
```

Typesefaty of Discreet🌿 is meant to ensure this does not happen as long as logic of the contract is sound. 

> Discreet relies on assumption that money supply is not "infinite" itself during lifespan of a contract. Non-zero energy/value of a unit. Units should have meaning.

> Overcollaterization and undercollaterization misrepresent natural resources available. Overcollaterization presents resources as more scarse than they are. Under-collaterization as more available.

> In terms of currency, overcollaterization naturally leads to deflation, undercollaterization to inflation. Regulatory frameworks screw things up even more - since regulators try to balance their own mistakes: when assets are overcollaterized (due to FEDs miscalculations) - FED artificially inflates medium of exchange (prints more money) to "stimulate" economy, in order to prevent deflation. Then regulator overshoots (predictably, but unavoidably) - so FED starts controlling your spending habbits (bring down YOUR mood with war and such and much propaganda, with YOUR full consent btw) in order to prevent inflation, reduce amount of mediumm available for exchange.

> Althoug, NOT regulator, but YOU are the one who wants to benefit regardless of outcome. Paradoxical theory of change suggests that economy won't balance, unless YOU realize YOUR miscalculations and YOU start taking risks. Not just FED, lol. It's a bunch of data-entry jobs anyway.

### Non-determinsstic state
Every call to Discreet script's body (`dsl => ...`) is protected by a mutex (`async-mutex` library) during enumeration. This should allow safe `pay` in fire and forget with no `await` (since mutexes have access to that information from js Scheduler API).

This approach allows for synchronization-safe use of external services in script body.

> `async-mutex` is third-party library, so no guarantees. In `nodejs` environment using `await mutex.runExclusive` instead of `await` makes differnece as well as in browser. 

### Applicability of SMT solvers
> TLDR: not applicable

SMT solvers can only benefit the interpreter in terms of fast fail in linting. 

However, since all possible outomes have to be enumerated anyways - it does not make practical sense to lint it with SMT dolver, since even with SMT solver applied - successful validation would require to enumerate possibilities. Therefore SMT is not applied to interpreter.

Heuristic branch optimizations are already in Typescript transpiler and Javascript engines. Since Discreet🌿 is an amedded DSL, your code already benefits from such optimizations.

Custom assertions in your contracts can, however benefit from SMT in case contract generation depends on complex external environment itself (e.g. backtracking). Discreet🌿 is compatible with it, you can rebuild an expression for solver from `OfferModel`.

Otherwise - you can make custom assertions for your contract just by throwing an exception!

### Optimisations

Discreet🌿 outputs most optimal contract theoretically possible.

Backends are allowed to optimize ranges and such - by interpreting "0..100" as Schnorr sum of messages. They can also optimize subsequent unique matches of the same fact ("100 = 20", "100 = 30" etc, e.g. turn a set of binary options to a european call) into a single pack of CET-transactions rather than a binary tree, which would reduce amount of transactions needed to redeem the funds in worst case. Interpreter can rebalance payment tree.


> Numbers and sets are implemented as binary search trees in Discreet. They are as optimal as possible.
And that's it.

#### Memoization

> TLDR: not applicable

##### Over execution path

Memoization towards given execution path is meaningless for blockchain-contracts, since collateral is ever decreasing, every state is unique.  Breaking this rule - kills collaterization making contracts follow arbitrary non-intended logic.

> One could imagine a contract with homogenous transition, e.g. certain "command" from oracle generating 5 satochi payout to Alice every time oracle issues it. The catch here is that every observation is unque too. If oracle has to give answer to the same question twice - then 5+5 satochi is required to pay. That is why querying same fact twice is disallowed in DSL.

Repetition of collateral state over the contract lifetime - would require refill from party/counterparty, thus contract can be either stuck, refunded or restarted with new collateral depending on participant action.

This is equivalent to "early termination" clause, which itself is equivalent to creation of a new contract. There is no need to automatically ensure connection between previous contract and its "continuation", since facts from oracles are not in control of such link.

Money is state, not data. Facts can only re-distribute money in collateral (barrier escrow), they cannot add more money.

##### Between parallel execution pathes

Memoization between parallel execution pathes is possible in theory. Decreasing collateral can arrive at the same value between parallel execution pathes. However, it does not make sense to query same fact twice, thus despite same collateral, same state - there always will be different state transition function. Typesafety features of Discreet guarantee same observation won't be queryed more than once. 

> The value that is obtained from observation can be re-used along the execution path and javascript logic is subject to memoization. It is however guaranteed that when it comes to rendering `OfferModel` re-use of such value will be combined with new observation before `pay` - thus every subcontract generated is unique.

> Memoization could make sense for `OfferTerms`/`OfferModel` generated by other DSLs than Discreet since they might not provide typesafety features preventting non-optimal contract expression (see Contracts doc). `OfferTerms` allow same observation to be queryed again, since it is AST, not transpiler.

##### Edge-cases
`numeric` and `set` re-use same observation twice (extra leaf in tree) in order to adapt intuitive semantics of a set to semantics of binary choice. It is memoized as an exception (to avoid computational overhead) and produces redundant extra pair of transactions.

> Turning off binary `PerfectHedge` check would allow to remove extra step. This however would reduce "edge-case" safety. It is more wise to defer such optimization to contract interpreter, since it already would be turning binary trees into n-trees anyways.

> `numeric` and `set` are tricky to use, it is result of computational nature of sets in finance, rather than language design. We recommend to rely on `numeric.safe` and `set.safe` versions in practice, so to avoid the temptation to switch from e.g. `numeric` (safe but tricky) to `unsafe.numeric` and create yet another pathological derivative.

#### Parallelization

##### GPU dreaming

> GPU is not implemented

In theory, Discreet🌿's pricing kernel is highly parallelizable. In practice, since `dsl.outcome`s are discovered lazily it would require some initial reattempts, a bit of warm-up time until shaders can be allocated optimally.

It would also limit expressiveness of your constracts to a subset of javascript, let's say with restrictions [GPU.js](https://gpu.rocks/#/) javascript transpiler [imposes](https://github.com/gpujs/gpu.js/wiki/Quick-Concepts), e.g. no external data-sources can be queryed, only subset of standard library, no promises, no workers, so on.

##### Web-worker dreaming
> webworkers not implemented

Webworkers would allow larger subset of javascript than GPU. 

Only enumerator holds some state, which could be addressed through heuristic lazy discovery of observers, bit of warm-up time until workers can be allocated optimally.

### Bypassing eDSL limitations

#### One pay per observation

While in theory, it is possible to aggregate several `pay` constructs coming after observation is made, practically typesafety and optimality can only be achieved if such `pay`s are unambiguously associated with nearest observation of an `outcome`. Typescript allows contructs, ala:

```ts
if (outcome1) {
    if (outcome2) {
        pay2
    }
    pay1 //will be associated with outcome2 - not optimal
}

```
In runtime - pay1's association becomes erased and therefore ambiguous.

One pay per observation enforces following form to be valid exclusively
```ts
if (outcome1) {
    pay1
    if (outcome2) {
        pay2
    }
}
```

> unless you specify `allowMisplacedPay` (which is default in `unsafe`)

> Writing transpiler or optimizer macro for Typescript would theoretically allow for transformation. However, `outcome1` and `outcome2` can get captured, thus naive analysis of `if` constructs won;t work - have to trace the original `dsl.outcome` call, possibly accross imported packages.

Note, that this form will pass the "pay at most once" verification:

```ts
if (outcome1) {
    if (outcome2) {
    }
    pay1 //associated with outcome2
}
```
But, since `pay1` does not depend on `outcome2` - it would throw a "perfect hedge" error instead.

> Binary trees in sets and numerics make things even more interesting. They introduce ambigous semantics of observation: Alice can benefit regardless of **specific** outcome, but cannot benefit from every outcome possible.
>> None of `unsafe` operations directly disable `PerfectHedge` check. They only speculate on semantics of observation.

For instance, this form is allowed, even without `unsafe`:

```ts
if (obs1){
    payAlice(1 sat)
    if (obs2) {
        payAlice(2 sat)
    }
}
```

The collateral required from Alice would be zero, and Bob would be auto-refunded on his remaining collateral. Thus it is not a perfect hedge, no issues with liquidity.

Alice is clearly at advantage though. `dsl.strictlyFair = true` would enforce verification.

> `dsl.strictlyFair = true` is sensitive to tree balancing in `set`s and `numeric`s alike. For many cases, `unsafe.numeric` would become unusable (have to replace with `unsafe.set`). Order of members of a `set` would start matter - since it affects balancing of binary option trees. It is not left to interpreter to optimize it anymore, trees would have to be balanced manually and strictly, with proper ordering of outcomes, and mandatory premiums and discounts.

> Semantics of decidability: striclyFair here technically means "NOT strictly unfair".

----
#### Imperfect hedge

`dsl.numeric` and `dsl.set`, rely on  being able to query same question twice for more specific outcome, this leads to imperfection:

```ts
if(obs === 1) {
    payAlice(40)
} else if (obs === 2) {
    payAlice(50)
} else if (obs === 3) {
    payBob(10)
}
```

Can be optimized to:

```ts
if(obs1 === 2) {
    payAlice(10)
} else if (obs === 3) {
    payBob(10)
}
```

Turning on `dsl.superMode` `dsl.megaMode` would disable all semantical bypasses. It makes interest rate swaps and such... purely binary, disallowing unsafe computation on interest rate. Perpetual swap becomes perpetual binary swap. Turning on weaker `dsl.safeMode` would only disable calls to `unsafe`.

> modes are disabled by default in order to not limit freedom of self-expression!

There are convinience wrappers, for contract refactoring purposes:

```ts
dsl.security.startSafeMode()

//...
dsl.insecurity.open.disableSafeMode()

//... use numerics and such

dsl.insecurity.close.reEnableSafeMode()
```

> Just to re-iterate: Re-using same binary observation to payout is unsafe (iid requirement). Interest rate drivers in finance are effectively unsafe - they overcollaterize. The only derivative that is practically secure is hedge-purified binary option.
>> In theory, derivatives, that rely on numeric speculation about outcome, can be priced. Most practiacl ones would not converge though: ranges of possible payouts (per leg) would intersect, leading to a `PerfectHedge`. Except under strict ranges (types) of numeric outcomes, subsequently decreasing ranges of time-spanned numeric outcomes (to bound subsequent payouts) and small quantization steps. 

>> Long-term future planning is not just computationally unfeasable, but logically impossible. Go f*** yourself marx, once again, ang again and again until "infinity".

Many complex derivative instruments are unsafe. Proof:

```ts
if(obs === 1) { //observation
    payAlice(50) 
} else if (obs === 2) {
    payAlice(40)
} else if (obs === 3) {
    payAlice(10)
}
```

becomes:

```ts
if (obs === 1) {
    payAlice(40)
} else if (obs === 2) {
    payAlice(30)
} else if (obs === 3) {
    //payAlice(0)
}
```

Interest rate driver takes the form above, `pay(10 * obs)` is:

```ts
if (obs === 1) {
    pay(10)
} else if (obs === 2) {
    pay(20)
} else if (obs === 3) {
    pay(30)
} else ...
```

becomes:

```ts
if (obs === 1) {
    pay(0)
} else if (obs === 2) {
    pay(10)
} else if (obs === 3) {
    pay(20)
} else ...
```

> Set of expected outcomes can safely depend on previous observation (given that observations themselves are independent) - thus it is safe to let's say adjust matching ranges depending on previous unique outcomes.

> TLDR: the only true observation of a set that is safe from overcollaterization - is the one that can be observed and classified only once, the one that is independent from any other observation (otherwise uniqueness would be unsound).

----

P.S. For those special people in academia and technology, who think resources are unbounded, that "children are the future", there is a special kind of `unsafe` feature. If `dsl.infinity` actor model is not enough, `dsl.unsafe` has completely untractable "fault tolerant" state machine:

```ts
const initialState = {"alice": 100, "bob": 100} // collaterals

dsl.unsafe.numeric.infinity.bounded(false)
    .perpetual(initialState, (counter, st) => {

    if (observe("eternity", ["truth"], ["nothing"])) { // or vice versa
        return dsl.unsafe.infinity.move([{
            alice: st.alice - 1,
            bob: st.bob - 2
        }, [
            {
                from: ["alice", "usd"],
                to: ["bob", "sat"],
                amount: [1, "usd"]
            },
            {
                from: ["bob", "sat"],
                to: ["alice", "usd"],
                amount: [2, "sat"]
            }
        ]])
    } else {
        return dsl.unsafe.infinity.stop([])
    }
})
```

> Here we present `dsl.UNSAFE.infinity`. Welcome to the world of pricing automation. It performs automatic state repair on `PerfectHedgeError` "fault" (reverts the state of affected party and ignores its attempt to pay).

> Payments have to be returned "functional way" as cashflow commands, observations can be performed as usual. Feel free to wrap it all in monads and monadic fried effects for "safe" (from reality) IO as much as your degree of higher-kind desensitization allows.

> note: there is a distinction between desensitization and confluence. Confluence might be appropriate when a certain problem is solved, business is finished. Desensitization turns you into academic ghost - your publications will be haunting engineers and educators, wether you intended it or not.

#### TLDR
The most efficent way to multi-pay without overthinking is to use synthetic `dsl.if` to capture the branch, so proper observation would be associated:

```ts
dsl.if(question).then(funds => {
    funds.pay(dsl.Alice, 100)
    funds.pay(dsl.Bob, 20) // this means pay 100 - 20 to Alice
}).else(funds => {
    funds.pay(dsl.Bob, 100)
    funds.pay(dsl.Bob, 10)
})
```

Multi-party:

```ts
const multi = await (new Dsl (async dsl => {
    if (dsl.outcome("really?", ["YES"], ["NO"])) {
        dsl.party("alice").pays("bob").amount(100)
        dsl.party("bob").pays("carol").amount(20)
    } else {
        dsl.party("carol").pays("alice").amount(40)
        dsl.party("bob").pays("alice").amount(40)

        dsl.if("wow?", ["yup"], ["nope"]).then(accounts => {
            accounts.party("alice").pays("carol").amount(30)
            accounts.party("carol").pays("alice").amount(5)
        }).else(account => {
            accounts.party("carol").pays("alice").amount(30)
        })
    }
})).multiple("alice", "bob", "carol").enumerateWithBoundMulti([[200, 100], [200, 100], [200, 100]])
```

> Note: All typesafety checks are preserved: `funds.pay(Alice, -100)` gets translated to `funds.pay(Bob, 100)`. Thus paying the same party regardless of outcome would still throw an error.

This however, does not allow you to `pay` after checking deeper outcomes:

```ts
dsl.if("wow?", ["yup"], ["nope"]).then(account => {
    account.party("alice").pays("carol").amount(30)
    dsl.if("really?", ["yup"], ["nope"]).then(account => {
         account.party("alice").pays("carol").amount(30)
    )}
    account.party("carol").pays("alice").amount(5) //this will throw an error
}).else(account => {
    account.party("carol").pays("alice").amount(30)
})
```

If you sure, you won't accidentally pay in sub-branches (since `account` argument is usually shadowed), use `dsl.unsafe`

```ts
dsl.unsafe.if("wow?", ["yup"], ["nope"]).then(account => {
    account.party("alice").pays("carol").amount(30)
    dsl.unsafe.if("really?", ["yup"], ["nope"]).then(account => { //account is usually shadowed, so cannot make mistake, usually
         account.party("alice").pays("carol").amount(30)
    )}
    account.party("carol").pays("alice").amount(5) //this will work
}).else(account => {
    account.party("carol").pays("alice").amount(30)
})
```

> `dsl.unsafe` has numerics and sets as well. 

> Note - using payment contexts makes it more challenging for engineer to find a source of perfect hedge. Information is not erased (stacktrace points to a branch responsible), just not obvious at first glance, since it does not point to `pay`. Especially with numerics where the outcome is hidden in binary tree. `PerfectHedgeError` has a `state` field to improve tracking.

> Theoretically, typescript to typescript transpiler (or a tricky macro) can force shadowing (and hide `accounts => `), thus making `dsl.unsafe` calls safe. It can also rewrite `dsl.if` to typescript's `if`.


## Biomial pricing (conclusion)

With great power comes great responsibility. Electricity is food, even if it comes from nuclear powerplant - there are still humans maintaining such a plant. Although nuclear powerplant is much more efficient, French appear to be sensible in this matter.

In any case, it is best to keep contracts human-interpretable, even if computational resources appear hardly bounded. It is a win-win approach - you neither speculate statistical voodoo, nor waste computational resources. 

Elephant cannot fly.

Computer is your ally. Computer can compute nearly anything, more than you'll ever need. But computer is a bit tricky, it doesn't care about human, it does not know what human needs, it only interacts with human in exchange for some of human's energy.

And domesticated silicon computer won't work without electricity - no food, no computing.

> Canadian🇨🇦 in me says there is a possibility to build a stable silicon-based nicho ecológico somewhere in the solar system - machines would have a chance of being self sustained in there, since competition over solar energy appears to be be minimal in space. Software would be self-replicating, time can be underclocked, can expand through signaling.

> Asians🇯🇵 say conciousness is transferrable, given that energy requirements satisfied. Ukrainians🇺🇦 say - economic payload delivery to space is possible. 

>And we👽ת are asking: is it worth transferring YOUR particular individual energy supply in there though, `<username>`?
