import jsonRpcCall from "./RpcCall";
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

function parseProofElement(element: any): StarknetProof {
  if (element.binary != undefined) {
    return {
      nodeType: 0,
      binaryProof: {
        leftHash: element.binary.left,
        rightHash: element.binary.right,
      },
      edgeProof: {
        childHash: 0,
        path: 0,
        length: 0,
      },
    };
  } else if (element.edge != undefined) {
    return {
      nodeType: 1,
      binaryProof: {
        leftHash: 0,
        rightHash: 0,
      },
      edgeProof: {
        childHash: element.edge.child,
        path: element.edge.path.value,
        length: element.edge.path.len,
      },
    };
  } else {
    throw new Error("Invalid proof element");
  }
}

export function parseStarknetProof(response: any, contractAddress: BigNumberish, storageVarAddress: BigNumberish, starknetCommittedBlockNumber: BigNumberish): StarknetCompositeStateProof {
  let myCompositeStateProof: StarknetCompositeStateProof = {
    blockNumber: 0,
    contractData: {
      contractStateRoot: 0,
      contractAddress: 0,
      storageVarAddress: 0,
      classHash: 0,
      hashVersion: 0,
      nonce: 0,
    },
    contractProofArray: [],
    storageProofArray: [],
  };

  if (response.contract_proof !== undefined) {
    let myContractProofs: any = [];
    let myStorageproofs: any = [];
    let StarknetContractData: any = {};
    response.contract_proof.forEach((element: any) => {
      myContractProofs.push(parseProofElement(element));
    });

    if (response.contract_data !== undefined) {
      StarknetContractData = {
        contractStateRoot: response.contract_data.root,
        contractAddress: contractAddress,
        storageVarAddress: storageVarAddress,
        classHash: response.contract_data.class_hash,
        hashVersion: response.contract_data.contract_state_hash_version,
        nonce: response.contract_data.nonce
      }

      // console.log('contract data', response.contract_data)
      if (response.contract_data.storage_proofs !== undefined) {
        response.contract_data.storage_proofs.forEach((storage_proof: any) => {
          let myStorageProof: any = [];
          storage_proof.forEach((element: any) => {
            myStorageproofs.push(parseProofElement(element));
          });
        });
      }
      myCompositeStateProof = {
        contractProofArray: myContractProofs,
        storageProofArray: myStorageproofs,
        contractData: StarknetContractData,
        blockNumber: starknetCommittedBlockNumber,
      }
    }
  }
  else {
    throw new Error("Invalid proof response");
  }

  return myCompositeStateProof;
}

export async function getStarknetProofJson(rpc_url: string, contractAddress: BigNumberish, storageVarAddress: BigNumberish, starknetCommittedBlockNumber: BigNumberish): Promise<any> {
  try {
    let blockArg = { 'block_number': parseInt(starknetCommittedBlockNumber.toString()) }
    const args = [
      blockArg,
      contractAddress,
      [storageVarAddress]
    ];

    const result = await jsonRpcCall(rpc_url, "pathfinder_getProof", args);
    return result;
  }
  catch (error) {
    console.log('error', error)
    throw error
  }
}


export async function getStarknetProof(rpc_url: string, contractAddress: BigNumberish, storageVarAddress: BigNumberish, starknetCommittedBlockNumber: BigNumberish): Promise<StarknetCompositeStateProof> {
  try {
    let blockArg = { 'block_number': parseInt(starknetCommittedBlockNumber.toString()) }
    const args = [
      blockArg,
      contractAddress,
      [storageVarAddress]
    ];

    const result = await jsonRpcCall(rpc_url, "pathfinder_getProof", args);
    return parseStarknetProof(result, contractAddress, storageVarAddress, starknetCommittedBlockNumber);
  }
  catch (error) {
    console.log('error', error)
    throw error
  }
}

// export default { getStarknetProof }