import { Server } from '@chainlink/ccip-read-server';
import { Command } from 'commander';
import { ethers } from 'ethers';
import jsonRpcCall from "./RpcCall";
import { hash, number } from "starknet";
//import { toFelt, toHex } from "starknet";


//const optimismSDK = require("@eth-optimism/sdk")
// const StubAbi = require('../../contracts/artifacts/contracts/l1/OptimismResolverStub.sol/OptimismResolverStub.json').abi
// const OptimismResolverAbi = require('../../contracts/artifacts/contracts/l2/OptimismResolver.sol/OptimismResolver.json').abi
const IResolverAbi = require('@ensdomains/op-resolver-contracts/artifacts/contracts/l1/OptimismResolverStub.sol/IResolverService.json').abi

// const namehash = require('eth-ens-namehash');

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
  .option('-l2p --l2_provider_url <url2>', 'L2_PROVIDER_URL', 'http://localhost:8545')
  .option('-r --l2_resolver_address <address>', 'L2_PROVIDER_URL')
  .option('-d --debug', 'debug', false)
  .option('-p --port <number>', 'Port number to serve on', '8081');
program.parse(process.argv);
const options = program.opts();
console.log({ options })
const { l1_provider_url, l2_provider_url, l2_resolver_address, l1_chain_id, l2_chain_id, debug } = options
const l1_provider = new ethers.providers.JsonRpcProvider(l1_provider_url);
//const provider = new ethers.providers.AlchemyProvider("goerli", 'demo')
//const l2_provider = new ethers.providers.JsonRpcProvider(l2_provider_url);
const server = new Server();

server.add(IResolverAbi, [
  {
    type: 'addr(bytes32)',
    func: async ([node], { to, data: _callData }) => {
      // const addrSlot = ethers.utils.keccak256(node + '00'.repeat(31) + '01');
      console.log(1, { node, to, _callData, l1_provider_url, l2_provider_url, l2_resolver_address, l1_chain_id, l2_chain_id })
      const blockNumber = (await l1_provider.getBlock('latest')).number
      let blockArg = { 'block_number': starknetCommittedBlockNumber }
      const args = [
        blockArg,
        l2_resolver_address,
        [storageAddress]
      ];

      jsonRpcCall("pathfinder_getProof", args).then((result) => {
        props.setStarknetCommittedBlockNumber(committedBlockNumber.toString());
        onResult(result);
        setIsLoading(false);
      });


      if (debug) {
        console.log(1, { node, to, _callData, l1_provider_url, l2_provider_url, l2_resolver_address, l1_chain_id, l2_chain_id })
        // const blockNumber = (await l2_provider.getBlock('latest')).number
        // console.log(2, { blockNumber, addrSlot })
        // let addressData
        // try {
        //   addressData = await l2_provider.getStorageAt(l2_resolver_address, addrSlot)
        // } catch (e) {
        //   console.log(3, { e })
        // }
        // console.log(4, {
        //   addressData
        // })
      }

      // let blockArg = { 'block_number': committedBlockNumber }
      // const args = [
      //   blockArg,
      //   contractAddress,
      //   [storageAddress]
      // ];
      // console.log(args)
      // // Call the JSON-RPC method with the given params
      // // and pass the result to the onResult callback
      // jsonRpcCall("pathfinder_getProof", args).then((result) => {
      //   props.setStarknetCommittedBlockNumber(committedBlockNumber.toString());
      //   onResult(result);
      //   setIsLoading(false);
      // });

      try {
        // storageProof = await crossChainMessenger.getStorageProof(l2_resolver_address, addrSlot, storageOption)
        // if (debug) console.log({ storageProof })
        // console.log(storageProof)
      } catch (e) {
        // console.log(e)
      }
      return [24325]
    }
  }
]);
const app = server.makeApp('/');
app.listen(options.port);
