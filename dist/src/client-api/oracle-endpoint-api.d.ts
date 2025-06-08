import { FactRequest, Commitment, Fact, OracleCapability } from "../protocol";
export interface OracleEndpointApi {
    requestNewCapability(question: string): Promise<OracleCapability | undefined>;
    requestCommitment: (req: FactRequest) => Promise<Commitment | undefined>;
    requestFact: (req: Commitment) => Promise<Fact>;
}
