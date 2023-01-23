import os
import asyncio
import json
# from dotenv import load_dotenv

from web3 import Web3
from web3.middleware import geth_poa_middleware

from starkware.starknet.services.api.gateway.transaction import Deploy, InvokeFunction
from starkware.starknet.compiler.compile import compile_starknet_files, get_selector_from_name
from starkware.cairo.lang.vm.crypto import pedersen_hash
from starkware.starknet.public.abi import get_selector_from_name, get_storage_var_address, starknet_keccak


print("initializer ", get_storage_var_address('_initializer'))
# print("pedersen_hash ", hex(pedersen_hash(
#     0x1e240, 0x206f38f7e4f15e87567361213c28f235cccdaa1d7fd34c9db1dfe9489c6a091) + 251))

print("pedersen_hash state_hash ", hex(pedersen_hash(pedersen_hash(pedersen_hash(0x21a7f43387573b68666669a0ed764252ce5367708e696e31967764a90b429c2,
      0x54d89b946081c6556161b34bcd7838c501575a3e9dc3d1d38a4438107b6b8fb), 0x0), 0x0)))


# print("pedersen_hash ", hex(pedersen_hash(
#     0x14d02362d13391cda05cf36cfe6635de96f002342b42ac755ec517e16bcf0fc, 0xecbe2ff7ef5c599c3e28ba8c61c6fafbe35fd8b1b89cf6cfe4fa9fa754bfb1)))
