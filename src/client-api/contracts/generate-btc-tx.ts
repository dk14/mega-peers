import { schnorrApi } from "./btc/schnorr";
import { PublicSession, txApi, UTxO } from "./btc/tx";

type PubKey = string
type Hex = string
type Msg = string
type TxId = string

const schnorr = schnorrApi()
const tx = txApi(schnorr)

export interface OpeningParams {
    aliceIn: UTxO[],
    bobIn: UTxO[],
    alicePub: PubKey,
    bobPub: PubKey,
    aliceAmountIn: number[],
    bobAmountIn: number[],
    changeAlice: number,
    changeBob: number,
    txfee: number
}

export interface ClosingParams {
    lockedTxId: TxId,
    alicePub: PubKey,
    bobPub: PubKey,
    aliceAmount: number,
    bobAmount: number,
    txfee: number
}

export interface CetParams {
    lockedTxId: TxId,
    oraclePub: PubKey, 
    answer: Msg, 
    rValue: Hex,
    alicePub: PubKey,
    bobPub: PubKey,
    aliceAmount: number,
    bobAmount: number,
    txfee: number,
    session?: PublicSession
}

export interface CetRedemptioParams {
    cetTxId: TxId, 
    oraclePub: PubKey, 
    answer: Msg, 
    rValue: Hex,
    alicePub: PubKey, 
    bobPub: PubKey,
    oracleSignature: Hex, 
    amount: number,
    txfee: number
}

export const generateOpeningTransaction = async (params: OpeningParams): Promise<Hex> => {
    return (await tx.genOpeningTx(
        params.aliceIn, 
        params.bobIn, 
        params.alicePub, 
        params.bobPub,
        params.aliceAmountIn, 
        params.bobAmountIn,
        params.changeAlice,
        params.changeBob,
        params.txfee)).hex
}

export const generateClosingTransaction = async (params: ClosingParams): Promise<Hex> => {
    const multiIn = {
       txid:  params.lockedTxId,
       vout: 0
    }
    return (await tx.genClosingTx(
        multiIn, 
        params.alicePub, 
        params.bobPub,
        params.aliceAmount, 
        params.bobAmount,
        params.txfee)).hex
}

export const generateCetTransaction = async (params: CetParams): Promise<Hex> => {
    const multiIn = {
        txid:  params.lockedTxId,
        vout: 0
     }
    const twistedPk = schnorr.adaptorPublic(params.oraclePub, params.answer, params.rValue).padStart(64, "0")
    return (await tx.genAliceCet(
        multiIn, 
        params.alicePub, 
        params.bobPub,
        twistedPk,
        params.aliceAmount, 
        params.bobAmount,
        params.txfee,
        params.session)).hex
}

export const generateCetRedemptionTransaction = async (params: CetRedemptioParams): Promise<Hex> => {
    const twistedPk = schnorr.adaptorPublic(params.oraclePub, params.answer, params.rValue).padStart(64, "0")
    const cetOut = {
        txid:  params.cetTxId,
        vout: 0
    }

    return (await tx.genAliceCetRedemption(
        cetOut, 
        twistedPk, 
        params.alicePub,
        params.oracleSignature,
        params.amount,
        params.txfee)).hex
}
