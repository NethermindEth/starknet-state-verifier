import { Server } from '@chainlink/ccip-read-server';
import { Command } from 'commander';
import { BigNumber, ethers } from 'ethers';
import jsonRpcCall from "./RpcCall";
import { hash, number } from "starknet";
import { BigNumberish } from "ethers";
import IStarknetResolver from './IStarknetResolverService.json'
import StarknetoreContract from './StarknetCoreContract.json'
import { Fragment, FunctionFragment, Interface, JsonFragment } from '@ethersproject/abi';

//import { toFelt, toHex } from "starknet";

interface MyBinaryProof {
  leftHash: BigNumberish;
  rightHash: BigNumberish;
}

interface MyEdgeProof {
  childHash: BigNumberish;
  path: BigNumberish;
  length: BigNumberish;
}

interface MyStarknetProof {
  nodeType: BigNumberish;
  binaryProof: MyBinaryProof;
  edgeProof: MyEdgeProof;
}

interface MyContractData {
  contractStateRoot: BigNumberish;
  contractAddress: BigNumberish;
  storageVarAddress: BigNumberish;
  classHash: BigNumberish;
  hashVersion: BigNumberish;
  nonce: BigNumberish;
}

interface MyStarknetCompositeStateProof {
  blockNumber: BigNumberish;
  contractData: MyContractData;
  contractProofArray: MyStarknetProof[];
  storageProofArray: MyStarknetProof[];
}

const CORE_CONTRACT_ADDRESS = '0xde29d060D45901Fb19ED6C6e959EB22d8626708e'
// const L2_RESOLVER_ADDRESS = '0x7412b9155cdb517c5d24e1c80f4af96f31f221151aab9a9a1b67f380a349ea3'

// const namehash = require('eth-ens-namehash');
// yarn start --l1_provider_url https://eth-goerli.alchemyapi.io/v2/ozZ0QV1qPAcGx_irBynNiiLkddGb689w  --l2_resolver_address 0x7412b9155cdb517c5d24e1c80f4af96f31f221151aab9a9a1b67f380a349ea3
const computeStorageAddress = (name: string, keys: string[]) => {
  // storage_var address is the sn_keccak of the name hashed with the pedersen hash of the keys
  console.log(name, keys)
  let res: any = hash.starknetKeccak(name)
  keys.forEach((key) => {
    if (key === '') return;
    let felt_key = number.toFelt(key);
    res = hash.pedersen([res, felt_key]);
  });
  return number.toHex(res);
}

function parseProofElement(element: any): MyStarknetProof {
  // console.log(element)
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


const program = new Command();
program
  .option('-l1p --l1_provider_url <url1>', 'L1_PROVIDER_URL', 'http://localhost:9545')
  .option('-r --l2_resolver_address <address>', 'L2_PROVIDER_URL')
  .option('-d --debug', 'debug', false)
  .option('-p --port <number>', 'Port number to serve on', '8081');
program.parse(process.argv);
const options = program.opts();
console.log({ options })
const { l1_provider_url, l2_resolver_address, debug } = options
const l1_provider = new ethers.providers.JsonRpcProvider(l1_provider_url);

const server = new Server();

function toInterface(abi: string | readonly (string | Fragment | JsonFragment)[] | Interface) {
  if (Interface.isInterface(abi)) {
    return abi;
  }
  return new Interface(abi);
}
server.add(IStarknetResolver.abi, [
  {
    type: 'addr(bytes32)',
    func: async ([node]: any, { to, data: _callData }) => {
      // const addrSlot = ethers.utils.keccak256(node + '00'.repeat(31) + '01');
      let myCompositeStateProof: MyStarknetCompositeStateProof = { blockNumber: 0, contractData: { contractStateRoot: 0, contractAddress: 0, storageVarAddress: 0, classHash: 0, hashVersion: 0, nonce: 0 }, contractProofArray: [], storageProofArray: [] }
      let tempCompositeStateProof: MyStarknetCompositeStateProof = { blockNumber: 0, contractData: { contractStateRoot: 0, contractAddress: 0, storageVarAddress: 0, classHash: 0, hashVersion: 0, nonce: 0 }, contractProofArray: [], storageProofArray: [] }
      const abiInterface = toInterface(IStarknetResolver.abi);
      const fn = abiInterface.getFunction('addr(bytes32)');
      console.log('fn', fn)


      try {
        console.log(1, { node, to, _callData, l1_provider_url, l2_resolver_address })
        const blockNumber = (await l1_provider.getBlock('latest')).number
        let starknetCoreContract = new ethers.Contract(CORE_CONTRACT_ADDRESS, StarknetoreContract.abi, l1_provider);
        const starknetCommittedBlockNumber = await starknetCoreContract.stateBlockNumber({ blockTag: blockNumber })
        const storageVarAddress = computeStorageAddress('resolver', [node])

        let blockArg = { 'block_number': starknetCommittedBlockNumber.toNumber() }
        const args = [
          blockArg,
          l2_resolver_address,
          [storageVarAddress]
        ];

        const result = await jsonRpcCall("pathfinder_getProof", args);
        console.log('result', JSON.stringify(result))

        if (result.contract_proof !== undefined) {
          let myContractProofs: any = [];
          let myStorageproofs: any = [];
          let myContractData: any = {};
          result.contract_proof.forEach((element: any) => {
            myContractProofs.push(parseProofElement(element));
          });

          if (result.contract_data !== undefined) {
            // console.log('contract data root', result.contract_data.root)

            // console.log('contract data', typeof (result.contract_data.root))
            // console.log('BigNumber.from', BigNumber.from(result.contract_data.root))
            // console.log('result.storageAddress', result.contract_data.storageAddress)
            myContractData = {
              contractStateRoot: result.contract_data.root,
              contractAddress: l2_resolver_address,
              storageVarAddress: storageVarAddress,
              classHash: result.contract_data.class_hash,
              hashVersion: result.contract_data.contract_state_hash_version,
              nonce: result.contract_data.nonce
            }

            // console.log('contract data', result.contract_data)
            if (result.contract_data.storage_proofs !== undefined) {
              result.contract_data.storage_proofs.forEach((storage_proof: any) => {
                let myStorageProof: any = [];
                storage_proof.forEach((element: any) => {
                  myStorageproofs.push(parseProofElement(element));
                });
                // myStorageproofs.push(myStorageProof);
              });
            }
          }

          myCompositeStateProof = {
            contractProofArray: myContractProofs,
            storageProofArray: myStorageproofs,
            contractData: myContractData,
            blockNumber: starknetCommittedBlockNumber,
          }
          //myCompositeStateProof.contractData = myContractData
          // const encoded = ethers.utils.defaultAbiCoder.encode(fn.outputs!, [tempCompositeStateProof])
          // console.log('encoded', encoded)

          console.log('myCompositeStateProof', JSON.parse(JSON.stringify(myCompositeStateProof)))
        }
      } catch (e) {
        console.log(e)
      }

      return [myCompositeStateProof]
    }
  },
]);
const app = server.makeApp('/');
app.listen(options.port);
