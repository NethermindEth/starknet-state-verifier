import { Server } from '@chainlink/ccip-read-server';
import { Command } from 'commander';
import { ethers } from 'ethers';
import { hash, number } from "starknet";
import IStarknetResolver from './IStarknetResolverService.json'
import StarknetoreContract from './StarknetCoreContract.json'
import { StarknetCompositeStateProof, getStarknetProof } from 'pathfinder_getproof_lib';

const PATHFINDER_RPC_URL = 'https://pathfinder-goerli.nethermind.io/rpc/v0.2';
const CORE_CONTRACT_ADDRESS = '0xde29d060D45901Fb19ED6C6e959EB22d8626708e'

// const L2_RESOLVER_ADDRESS = '0x7412b9155cdb517c5d24e1c80f4af96f31f221151aab9a9a1b67f380a349ea3'
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


const program = new Command();
program
  .option('-l1p --l1_provider_url <url1>', 'L1_PROVIDER_URL', 'http://localhost:9545')
  .option('-l2p --l2_provider_url <url2>', 'L2_PROVIDER_URL', PATHFINDER_RPC_URL)
  .option('-r --l2_resolver_address <address>', 'L2_PROVIDER_URL')
  .option('-p --port <number>', 'Port number to serve on', '8081');
program.parse(process.argv);
const options = program.opts();
console.log({ options })
const { l1_provider_url, l2_provider_url, l2_resolver_address, debug } = options
const l1_provider = new ethers.providers.JsonRpcProvider(l1_provider_url);

const server = new Server();

server.add(IStarknetResolver.abi, [
  {
    type: 'addr(bytes32)',
    func: async ([node]: any, { to, data: _callData }) => {
      let myCompositeStateProof: StarknetCompositeStateProof = { blockNumber: 0, classCommitment: 0, contractData: { contractStateRoot: 0, contractAddress: 0, storageVarAddress: 0, classHash: 0, hashVersion: 0, nonce: 0 }, contractProofArray: [], storageProofArray: [] }
      try {
        console.log(1, { node, to, _callData, l1_provider_url, l2_resolver_address })
        const blockNumber = (await l1_provider.getBlock('latest')).number
        let starknetCoreContract = new ethers.Contract(CORE_CONTRACT_ADDRESS, StarknetoreContract.abi, l1_provider);
        const starknetCommittedBlockNumber = await starknetCoreContract.stateBlockNumber({ blockTag: blockNumber })
        const storageVarAddress = computeStorageAddress('resolver', [node])
        myCompositeStateProof = await getStarknetProof(l2_provider_url, l2_resolver_address, storageVarAddress, starknetCommittedBlockNumber)
        console.log('myCompositeStateProof', JSON.parse(JSON.stringify(myCompositeStateProof)))
      } catch (e) {
        console.log(e)
      }

      return [myCompositeStateProof]
    }
  },
]);
const app = server.makeApp('/');
app.listen(options.port);
