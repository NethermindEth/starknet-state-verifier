import { CheckCircleIcon } from '@chakra-ui/icons'
import { Box, Button, Flex, Text } from '@chakra-ui/react'
import {useAccount, useConnect, useDisconnect, useEnsName} from 'wagmi'
import {InjectedConnector} from 'wagmi/connectors/injected'
import { shortenHex } from '../utils/helpers'

const ConnectWallet = () => {
  const {address, isConnected} = useAccount()
  const {data: ensName} = useEnsName({address})
  const {connect} = useConnect({
    connector: new InjectedConnector(),
  })
  const {disconnect} = useDisconnect()

  if (isConnected) {
    return <Flex justifyContent={"center"} alignItems={"center"}>
      <Text mr={"2"}>
        <CheckCircleIcon color={"green"}/>
        {ensName ?? shortenHex(address || "0x0000000000000000000000000000", 6)}
      </Text>
      <Button onClick={() => disconnect()}>Disconnect</Button>
    </Flex>
  }
  return <Button onClick={() => connect()}>Connect Wallet</Button>
}

export default ConnectWallet;