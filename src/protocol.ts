export interface MsgLike {
    seqNo: number 
    cTTL: number 
}

export interface WithPow {
    pow: HashCashPow
}

export type Value = string
export type Answer = string

export interface Param {
    name: string
    values: Value[]
}

export interface OracleManifest { //for domain verification, publish this json on your website
    domain: string
    id: OracleId
    meta: any
    capapbilities: OracleCapability[]
    signature: string
    sinatureType: string
}

export interface Commitment {
    req: FactRequest
    contract: string
    rValueSchnorrHex?: string
    curve?: string
    rewardAddress?: string
    oracleSig: string
    factRetentionPeriod?: string // how long would fact be available in oracle's database
}

export interface OracleCapability extends MsgLike {
    oraclePubKey: string
    capabilityPubKey: string
    capabilitySignatureType?: string
    question: string // oracle is responsible for unambiguity of question - this field can be use to match capabilities of different oracles

    seqNo: number 
    cTTL: number

    oracleSignature: string //sign this OracleCapability JSON record (with empty string signature field)
    oracleSignatureType: string
    pow: HashCashPow

    tags?: string[]
    off?: boolean
    
    params?: Param[] //possible params
    answers?: Answer[] //possible answers
    endpoint?: string //how to query oracle; e.g. `http://...`; special protocol: `web-oracle:peerjs-handle`; use `web-oracle:local` for local mocks
    commitmentEndpoint?: string //where to get comitment to future value from oracle
    meta?: any
}


export interface HashCashPow {
    difficulty: number
    algorithm: string
    hash: string //empty string for preimage
    magicNo: number
    magicString?: string
}

export interface Bid {
    paymentType?: string
    amount: number
    proof: string
}

export interface OracleId extends MsgLike, WithPow {
    pubkey: string // sign every request/response
    seqNo: number //used for broadcast
    cTTL: number //used for broadcast

    pow: HashCashPow
    manifestUri?: string //point to OracleManifest json on a reputable website

    bid: Bid

    oracleSignature: string
    oracleSignatureType: string
    tags?: string[]
    previousId?: OracleId //in case oracle has to change pubkey
    previousIdSignatureToNewPubkey?: string
    partOf?: OracleId[]
    parts?: OracleId[]
    meta?: any
}

export interface FactRequest {
    capabilityPubKey: string
    arguments: { [id: string] : string; }
    invoice?: string
}

export interface ProofOfPayment {
    request: FactRequest
    proofOfPayment: string
}

export interface Fact {
    factWithQuestion: string
    signatureType: string
    signature: string
    extraProofs?: any[]
    extraProofsSignature?: string
}

export interface WithFactRequest {
    request: FactRequest
    capabilitySignatureOverRequest?: string
    commitment?: Commitment
}

export interface FactDisagreesWithPublic extends WithFactRequest { //this report is for manual review, it requires pow to submit in order to avoid spamming. Strongest pows will be prioritized
    type: 'fact-disagreees-with-public'
    request: FactRequest
    capabilitySignatureOverRequest?: string
    fact?: Fact
    comment?: string
}

export interface FactConflict extends WithFactRequest {
    type: 'fact-conflict'
    request: FactRequest
    capabilitySignatureOverRequest?: string
    fact: Fact
    facts: Fact[] //must be of the same capability; TODO validator
}

export interface FactMissing extends WithFactRequest {
    type: 'fact-missing'
    request: FactRequest
    capabilitySignatureOverRequest: string
    payment?: ProofOfPayment
    dispute?: Fact
}

export interface AdCollision extends WithFactRequest {
    type: 'ad-collision'
    proofOfOracleAdConflict: OracleId[]
    proofOfCapabilityAdConflict: OracleCapability[]
}

export type MaleabilityReport = FactDisagreesWithPublic | FactConflict | FactMissing | AdCollision | FreeForm

export interface Dispute {
    claim: FactMissing
    reportPow: HashCashPow
    oraclePubKey: string
    fact: Fact
}

export interface Report extends MsgLike, WithPow {
    seqNo: number
    cTTL: number
    pow: HashCashPow
    oraclePubKey: string
    content: MaleabilityReport
    meta?: any
}

export interface OfferTerms {
    question: FactRequest
    question2?: FactRequest
    question3?: FactRequest
    partyBetsOn: Answer[]
    counterPartyBetsOn: Answer[]
    partyBetAmount: number
    counterpartyBetAmount: number
    dependsOn?: DependsOn
    partyCompositeCollateralAmount?: number //this is needed to ensure that whole tree of CET-transactions is recovered
    counterpartyCompositeCollateralAmount?: number
    cumulativeTxFee?: number
    assetPair?: [string, string] // if parties bet assets
    synonyms?: {[id: Answer]: Answer} //for adapting oracle quorums
    txfee?: number
}

export interface PartiallySignedTx {
    tx: string
    sessionIds: string[]
    nonceParity: boolean[]
    sessionNonces: string[]
    sesionCommitments: string[]
    partialSigs: string[]
    hashLocks?: string[]
    hashUnlocks?: string[]
}

export type OfferHashCash = string

export interface DependsOn { //for schedules, aka stateful multi-stage contracts, everything that Marlowe can do
    outcome: Answer
    orderId?: string // undefined means ANY_PREVOUT, a function or recursive call; it is safe to do it, sine dsl would inline any closures (previous observations) required; btc is purely functional
}

export interface AcceptOffer {
    chain: string
    openingTx: PartiallySignedTx
    offerRef: string
    cetTxSet: PartiallySignedTx[]
    previousAcceptRef?: string //for sharing precommitments in interactive sign
    acceptorId?: string
    acceptorSig?: string
}

export interface FinalizeOffer {
    txid: string
    acceptRef: string
    tx?: string
    previousFinalRef?: string
    redemptionTxId?: string
    redemptionTx?: string
    backup?: string
}

export interface Offer {
    message: string
    customContract: string
    terms: OfferTerms
    blockchain: 'bitcoin-testnet' | 'bitcoin-mainnet' | 'plutus-testnet'
    contact: string
    transactionToBeCoSigned?: PartiallySignedTx 
    accept?: AcceptOffer //note for interactive sign: counterparty returns its commitment through this first time and party replies with its commitment; second time: party returns its nonce; third time ccounterparty returns nonce and partial sig
    finalize?: FinalizeOffer //here after final signature is put; txid is reported
    failed?: string
    encryptedDetails?: string //to make matching private - can encrypt actual `Offer` here
    originatorId?: string //for matching
    originatorSig?: string //for matching - to check if u really originator
    acceptorId?: string //for matching
    acceptorSig?: string //for matching - to check if u really originator
    orderId?: string 
    dependantOrdersIds?: string[]

    addresses?: string[]
    pubkeys?: [string, string],
    utxos?: [[string, number][], [string, number][]]
    checkLockTimeVerify?: string,
    meta?: any
}

export interface OfferMsg extends MsgLike, WithPow {
    seqNo: number
    cTTL: number
    pow: HashCashPow
    content: Offer
}

export interface PagingDescriptor {
    page: number
    chunkSize: number
}


export type Registered = 'success' | 'duplicate'
export type NotRegistered = 'low pow difficulty' | 'wrong signature' | 'wrong pow' | 'no oracle found' | ['invalid request', string]

export type DisputeAccepted = Registered
export type DisputeRejected = NotRegistered | 'invalid fact' | 'report not found' | 'unknown'

export type ReportAccepted = Registered
export type ReportRejected = NotRegistered

















































export interface FreeForm extends WithFactRequest {
    type: 'free-form'
    topic: string
    msg: string
    privacyLeakMsg?: string
    suspectMarketManipulationMsg?: string
    personalMsg?: string
    confusionMsg?: string
    recommendationForOracleMsg?: string
    reporterContact?: string
    proofs: string[]
    disputeReportMsg?: string
    disputedReportHashRef?: string

    commentOnReportMsg?: string
    commentedReportHashRef?: string

    questionIsTooBroad?: boolean
    questionIsTooSpecific?: boolean

    wrongTagsOracleId?: string[]
    wrongTagsCapability?: string[]
    endpointNotAvailable?: boolean
    endpointDoesNotReturnCommitment?: boolean

    relatedInfoLinks?: string[]
    isRelatedToTechnicalIssue?: boolean
    isRelatedToPuplicConsensusOverFact?: boolean
    isRelatedToLocalConsensusOverFact?: boolean
    isRelatedToFactDisprovedAfterBeingPublished?: boolean
    isRelatedToScientificFact?: boolean
    isRelatedToMathematicallyDisprovableFact?: boolean

    isWellKnownFact?: boolean

    typoInFact?: boolean
    misspellingInFact?: boolean

    isFictionalFactAdvertisedAsReal?: boolean

    isRelatedToAcademicDisagreementOverFact?: boolean
    relatedPeerReviewedArticles?: string[]

    eyewitness?: boolean
    relatedToFact?: boolean
    wantToClarifyFact?: boolean
    factQuestionIsOverlySubjective?: boolean
    factQuestionIsOverlyObjective?: boolean

    didOracleRequestPrivateData?: boolean
    didOracleRevealPrivateData?: boolean
    didOracleRequestContractTerms?: boolean
    didOracleRevealContractTerms?: boolean

    didOracleSlightlyAlterFacts?: boolean

    conspiracyWithCounterpartySuspected?: boolean
    illShareContractTermsEvenThoughIshouldnt?: OfferTerms
    coersionSuspected?: boolean
    manipulationOfPublicConsensusSuspected?: boolean

    factsInContradiction?: Fact[]
    brokenSemantics?: Fact[]
    brokenFormat?: Fact[]
    brokenParameters?: [FactRequest, Fact]

    unfairCompetitionAmongOracles?: boolean

    unethical?: boolean
    immoral?: boolean
    sexualContent?: boolean
    drugsRelated?: boolean
    illegal?: boolean
    religion?: boolean
    nations?: boolean
    states?: boolean
    families?: boolean
    traditions?: boolean
    corporate?: boolean
    violence?: boolean
    hate?: boolean
    dangerous?: boolean
    crazy?: boolean
    evil?: boolean
    mossad?: boolean
    jews?: boolean
    aliens?: boolean

    anotherDimension?: boolean

    advertisesSomeOnesPrivateData?: boolean
    advertisesMilitaryOrCorporateSecrets?: boolean
    

    bringsDownHumanity?: boolean
    noVibe?: boolean //these are to quickly filter such reports out from reputation calc (or filter in!)
    duude?: boolean
    fakeNews?: boolean
    jfhsjfhl?: boolean
    iCanProvideBetterFacts?: boolean
    iDontgetIt?: boolean
    I?: boolean
    cool?: boolean
    iKnowTheTruth?: boolean
    myFootballTeamLost?: boolean
    addictedToBets?: boolean

    iAgreeWithFact?: boolean
    iSoAgreeWithFact?: boolean
    iRateFactFrom1to10?: number

    iBelongToHackerGroups?: string[]
    iBelongTo?: string[]
    iReportTo?: string[]
    iAmThisAndThis?: string[]
    youAreThisAndThat?: string[]
    youAreSuchAndSuch?: string[]
    iFeel?: string[]
    iThink?: string[]
    iIdentify?: string[]
    iAlienate?: string[]

    theyLyingWhoThey?: string[]

    iAdvertiseSomethingBtw?: string[]
    iSellSomethingBtw?: string[][]
    iBuySomethingBtw?: string[][]
    iKnowSomethingBtw?: string[][][]

    iJustPowEveryOracleIfind?: boolean

    notInMyNewsPaper?: boolean
    relatedBroScienceArticles?: string[]
    dontLikeTheFactsDontFeelLikeIt?: boolean

    aesthetics?: boolean
    technology?: boolean
    randomnessAndChaos?: boolean
    phylosophy?: boolean
    inversion?: boolean
    darkness?: boolean
    humour?: boolean
    words?: boolean
    
    oracleIsInSomeonesPocket?: boolean
    oracleThreatenedYou?: boolean
    psychologicalManipulationByOracle?: boolean

    fakeOracle?: boolean
    questionDoesNotMakeSense?: boolean
    dontWantToKnowAnswer?: boolean
    iChangedMyMind?: boolean
    youChangedYourMind?: boolean
    iChangedYourMind?: boolean
    youChangedMyMind?: boolean
    changeMind?: boolean

    iOverPaid?: ProofOfPayment[]
    oracleAskedMoreMoney?: boolean
    iPaidMore?: ProofOfPayment[]
    iWantMoneyBack?: boolean
    illGetItMyself?: boolean
    iKnowYourIP?: boolean
    iKnowWhereYouLive?: boolean
    iKnowWhereILive?: boolean
    iKnowMyIp?: boolean

    youShouldRespectOtherPeopleOpinion?: boolean
    youShouldBeMoreOpenlyMinded?: boolean
    youShouldBe?: string[]
    everyoneHasTheirOwnTruth?: boolean
    thisGuySaysWhichGuy?: string[]
    thisGuySaysWhat?: string[]
    iReadThisWhere?: string[]
    iReadThisWhat?: string[]
    iMSure?: boolean
    iMNotSure?: boolean

    myFavoriteNumberIs?: number
    myFaviriteColorIs?: string[]
    myFaviriteIs?: string[]
    myNameIs?: string[]
    myAddressIs?: string[]

    iWasThereWhere?: string[]
    iWasThereWhen?: string[]
    iWasThereWithWho?: string[]
    iWasThereWithWhom?: string[]
    iWasThereWithWhy?: string[]
    iWasThereHow?: string[]
    howIsItRelevant?: boolean

    hereAndNow?: boolean

    fakeCommitment?: Commitment[]

    topics?: string[]
    reportTags?: string[]

    extraQuestionnaireAskedWithAnswers?: string[][]

    autoGenerated?: boolean
    analysisResultOfHashRef?: string
    analysisType?: string
    analysisEntity?: string
    analysisModel?: string //could be manual
    analysisStruct?: any
    analysisParams?: any
    analysisTags?: string

    interpretationType?: string
    interpretation?: string
    interpreters?: string[]
    interpretersPubKeys?: string[]
    interpretersSignatures?: string[]

    reporterPubKey?: string
    reporterSignature?: string

    relatedPosts?: string
    socialLinks?: string[]

    extrameta: any
    
    onBehalfOf?: string[]
    selfReportedTimestamp?: string
    knownChronologicallyPreceedingReportsHashRefs?: string[]
    unknownChronologicallySucceedingReportsHashRefs?: string[]
}