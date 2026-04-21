A p2p fact sharing network

# Mega Peers

Mega *(from מַגָע, contact)* - is a lightweight infinitely scalable decentralized data marketplace, bringing authentic observers to blockchain.

## Design

Mega acts as a p2p oracle advertisement network.

Mega relies on Proof-Of-Work in order to assign identities to oracles. It models real-life aquisition of identity: through physical effort!*

>*a demonstration of ability to act in a physical world!

Oracle's reputation is managed as a set of verifiable reports of malleability. Traders also do some PoW (for spam-protection) in order to report malicious oracle. Oracle's credibility is estimated from the inverse of a sum of PoW done on reports against it, or subjectively based on contents of reports ([Manifest](manifest.md)).

Everything is stored in Mega's mempools. No blockchain required for the network.

Mega supports advertisement for trading offers. Offer format allows expression of any meaningful type of contract: from binary options to "perpetual" swaps ([Trader](traders.md)). Mega provides powerful typesafe eDSL for writing contracts of arbitrary complexity ([Discreet](dsl.md)). 

Trader's contracts are free from oracle's supervision. Oracle is not aware of trader's blockchain at all. Pull-based model ([Oracle](oracle.md))



## Strong Oracle Identities

Oracle quorums is secondary, optional, feature in Mega, since the primary, stronger assurance, is individual oracle's **pseudonymous identity** acquired through PoW. We simply evaluate:

- oracle's identity strength from its PoW-difficulty, 
- oracle reputation from PoW-difficulty of reports filed (by traders) against its `OracleId`.

$identityStrength_i = \sum (oraclePow_i  + \sum capabilityPow_{ij})$

$identityScore_i = identityStrength_i - \sum malleabilityReportPow_{ijk}$

## Sybyl attacks resistance

This, combined with mempool evictions, provides resistance to Sybil-attacks: it is more beneficial for a single coherent physical identity to accumulate PoW under a single `OracleId` rather than shutter it across **small identities** which would be likely `low pow` **evicted** from pool. 

Meaningful identities are selected based on competition in a mempool with finite capacity.

Proof:

**Each weak pow is subject to threshold restriction. Weak pows surviving selection:**

$weakSelection = \sum (weakPow_i > mempoolThreshold)$

**Unified pow surviving selection (either 0 or sum):**

$strongSelection = megaPow > mempoolThreshold$,
where
$megaPow = \sum pow_i$

**Property $ strongSelection > weakSelection $ is satisified for sound threshold.**

**Property $ strongSelection \geq weakSelection $ is satisfied universally (completeness).**

> For, $\exists i, 0 < pow_i < mempoolThreshold$, $mempoolThreshold$ is sound. Since capacity $operatorCapacity > count (pow_i)$ must be finite, evictions will happen. 

QED.
> Semantics: mempool capacity is chosen based on resources available to operator and an estimate of the number of real identities existing in a given market/ecosystem. 

>E.g. if ecosystem has 1J energy and the minimum perceptible id is 0.1J, then up to 10 identities can be issued.


## How it works
![image](https://lh7-rt.googleusercontent.com/docsz/AD_4nXeUWfzdI9ARP760J9ZquB5KRgfNXDRj_Z976U3KmiKf23Ky9LqC-alwiwpTZ3IAotH5BUVJAWY0-eE3wDn1mGuCyZwfGgN9suGuc08eIq8k4PihpvsgJnSERdDJwKYL6HlEgFXcFw?key=Rm1gHfOo0ww9LGQzkRjPFZRP)
1-trader, 2-mega p2p, 3-oracle, 4-trader-wallet, 5-oracle endpoint

[Presentation](https://docs.google.com/document/d/e/2PACX-1vRQcR311NiVjCxc2Q3cdXWjoKGSNYf7rKrgqkeiEmv8LF3uGBqODSEzujR-XuTyHsMAf0hhGl6B1Anj/pub)
