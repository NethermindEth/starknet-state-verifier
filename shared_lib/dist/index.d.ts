import { BigNumberish } from "ethers";
export interface BinaryProof {
    leftHash: BigNumberish;
    rightHash: BigNumberish;
}
export interface EdgeProof {
    childHash: BigNumberish;
    path: BigNumberish;
    length: BigNumberish;
}
export interface StarknetProof {
    nodeType: BigNumberish;
    binaryProof: BinaryProof;
    edgeProof: EdgeProof;
}
export interface StarknetContractData {
    contractStateRoot: BigNumberish;
    contractAddress: BigNumberish;
    storageVarAddress: BigNumberish;
    classHash: BigNumberish;
    hashVersion: BigNumberish;
    nonce: BigNumberish;
}
export interface StarknetCompositeStateProof {
    blockNumber: BigNumberish;
    contractData: StarknetContractData;
    contractProofArray: StarknetProof[];
    storageProofArray: StarknetProof[];
}
export declare function parseStarknetProof(response: any, contractAddress: BigNumberish, storageVarAddress: BigNumberish, starknetCommittedBlockNumber: BigNumberish): StarknetCompositeStateProof;
export declare function getStarknetProof(rpc_url: string, contractAddress: BigNumberish, storageVarAddress: BigNumberish, starknetCommittedBlockNumber: BigNumberish): Promise<StarknetCompositeStateProof>;
//# sourceMappingURL=index.d.ts.map