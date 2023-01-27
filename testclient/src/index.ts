import { Command } from 'commander';
import { ethers, BigNumber, BigNumberish } from 'ethers';
import 'isomorphic-fetch';
import StarknetVerifier from './StarknetVerifier.json'
const namehash = require('eth-ens-namehash');
const program = new Command();
const { defaultAbiCoder, hexConcat } = require("ethers/lib/utils");
program
  .requiredOption('-r --registry <address>', 'ENS registry address')
  .option('-l1 --l1_provider_url <url1>', 'L1_PROVIDER_URL', 'http://localhost:9545')
  .option('-i --chainId <chainId>', 'chainId', '5')
  .option('-n --chainName <name>', 'chainName', 'goerli')
  .option('-d --debug', 'debug', false)
  .argument('<name>');
// ens registry address -> 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
// alchemy url -> https://eth-goerli.alchemyapi.io/v2/ozZ0QV1qPAcGx_irBynNiiLkddGb689w

//yarn start --registry 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e  princeisagreatdeveloper.eth  --l1_provider_url https://eth-goerli.alchemyapi.io/v2/ozZ0QV1qPAcGx_irBynNiiLkddGb689w
program.parse(process.argv);
const options = program.opts();
const ensAddress = options.registry;
const chainId = parseInt(options.chainId);
const { chainName, l1_provider_url, debug } = options
console.log({ l1_provider_url, ensAddress, chainId, chainName, debug })
let provider
if (chainId && chainName) {
  provider = new ethers.providers.JsonRpcProvider(l1_provider_url, {
    chainId,
    name: chainName,
    ensAddress
  }
  );
} else {
  provider = new ethers.providers.JsonRpcProvider(options.l1_provider_url);
}
// provider.on("debug", console.log)
// const l2provider = new ethers.providers.JsonRpcProvider(options.l2_provider_url);

(async () => {
  const l1ChainId = parseInt(await provider.send('eth_chainId', []))
  // const l2ChainId = parseInt(await l2provider.send('eth_chainId', []))

  const name = program.args[0];
  const node = namehash.hash(name)
  const nodeInBigNumber = BigNumber.from(node)
  const mask250Bits = BigNumber.from(2).pow(250).sub(1)
  const nodeForl2resolver = nodeInBigNumber.and(mask250Bits)
  // const nodeForl2resolver = (node & ((2 ** 250) - 1))
  console.log({ l1ChainId, name, node, nodeForl2resolver })
  let r = await provider.getResolver(name);
  if (r) {
    const resolver = new ethers.Contract(r.address, StarknetVerifier.abi, provider);
    // const iresolver = new ethers.Contract(r.address, IStarknetResolver.abi, provider);
    try {
      console.log('addr(bytes32,uint256)', await resolver.callStatic['addr(bytes32,uint256)'](node, 9004, { ccipReadEnabled: true }))
      // if (debug) {
      //   // this will throw OffchainLookup error
      //   // console.log(await resolver.callStatic['addr(bytes32)'](node))
      // } else {
      // const beforeTime = (new Date()).getTime()
      // console.log('getAddress           ', await r.getAddress());
      // const afterTime = (new Date()).getTime()
      // console.log('(call time=', afterTime - beforeTime, ')')
      // // console.log('getAddress(60)       ', await r.getAddress(9004));
      // console.log('_fetchBytes          ', await r._fetchBytes('0xf1cb7e06', '0x000000000000000000000000000000000000000000000000000000000000003c'))
      // console.log('addr(bytes32)        ', await resolver.callStatic['addr(bytes32)'](node, { ccipReadEnabled: true }))
      // console.log('resolveName', await provider.resolveName(name));
      // }
    } catch (e) {
      // Manually calling the gateway
      console.log('error', e)
      if (e.errorArgs) {
        const { sender, urls, callData, callbackFunction, extraData } = e.errorArgs
        console.log(1, { sender, urls, callData, callbackFunction, extraData })
        const url = urls[0].replace(/{sender}/, sender).replace(/{data}/, callData)
        console.log(2, { url })
        const fetched = await fetch(url)
        const responseData: any = await (fetched).json()
        if (responseData) {
          try {
            const encoded = defaultAbiCoder.encode(["bytes", "bytes"], [responseData.data, extraData]);
            const data = hexConcat([callbackFunction, encoded])
            const result = await resolver.provider.call({
              to: resolver.address,
              data
            });
            console.log(4, { result })
            const decodedResult = resolver.interface.decodeFunctionResult("bytesAddrWithProof", result);
            console.log(5, { decodedResult })

          } catch (ee) {
            console.log(6, { ee })
          }
        }
      }
    }
  }
})();
