import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ChakraProvider } from '@chakra-ui/react'
import { Chain, WagmiConfig, createClient, configureChains, mainnet, goerli } from 'wagmi'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
// import * as dotenv from 'dotenv'
// dotenv.config();
const localChain: Chain = {
  id: 1337,
  name: 'local',
  network: 'localhost',
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
  },
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
}




// const { chains, provider } = configureChains(
//   [localChain],
//   [
//     jsonRpcProvider({
//       rpc: (chain) => {
//         if (chain.id === 1337) {
//           return {
//             http: `http://localhost:8545`,
//           }
//         } else {
//           return {
//             http: `https://polygon-mainnet.infura.io/v3/lol`,
//           }
//         }
//       },
//     }),
//   ],
// )

const { chains, provider } = configureChains(
  [mainnet, goerli, localChain],
  [
    alchemyProvider({ apiKey: 'Y34XwDhP6AoV7vVR74EFHjtlOJkMYPe4' }),
    publicProvider(),
    // jsonRpcProvider({
    //   rpc: (chain) => {
    //     if (chain.id === 1337) {
    //       return {
    //         http: `http://localhost:8545`,
    //       }
    //     }
    //     else {
    //       return {
    //         http: `https://polygon-mainnet.infura.io/v3/lol`,
    //       }

    //     }
    //   }
    // },
    // ),
  ],
  { stallTimeout: 5000 },
)

const client = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new InjectedConnector({
      chains,
      options: {
        name: 'Injected',
        shimDisconnect: true,
      },
    })],
  provider,
})


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider>
      <WagmiConfig client={client}>
        <App />
      </WagmiConfig>
    </ChakraProvider>
  </React.StrictMode>,
)
