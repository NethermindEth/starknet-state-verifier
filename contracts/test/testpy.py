import os
import asyncio
import json
# from dotenv import load_dotenv

from web3 import Web3
from web3.middleware import geth_poa_middleware

from starkware.starknet.services.api.gateway.transaction import Deploy, InvokeFunction
from starkware.starknet.compiler.compile import compile_starknet_files, get_selector_from_name
from starkware.cairo.lang.vm.crypto import pedersen_hash
from starkware.cairo.lang.compiler.test_utils import short_string_to_felt
from starkware.starknet.public.abi import get_selector_from_name, get_storage_var_address, starknet_keccak
from starkware.cairo.common.poseidon_hash import poseidon_hash, poseidon_hash_many
 
#ROUGH TEST AREA, NOT PART OF THE PROJECT TESTS. USED FOR VERIFICATION, DEBUGGING AGAINST EXISTING PYTHON IMPLEMENTATION
# state_commitment=ℎ("STARKNET_STATE_V0",contracts_tree_root,classes_tree_root)


print("pedersen_hash contract root ", hex(pedersen_hash(
    0xca8ac56bd313f8355dc40776427409f119924fe9067320fff8fd8765b766df, 0x7fb20da4f329a630f4bdfb75afae4ec93140da3a2527986c2cb7ee7361b9dea) ))
print ('STARKNET_STATE_V0 to felt ',short_string_to_felt('STARKNET_STATE_V0') )
print ("state commitment poseidon_hash_many ", hex(poseidon_hash_many([28355430774503553497671514844211693180464, 0x34894aedf9548524f9e5bb189472d25abe3c38befd577c90886a7c519e5eee4, 0x70c5acad61a421be9c2945b921e263f2699c668f20d31c90660e91b32ea99de])))

# print("initializer ", get_storage_var_address('resolver'))
# print("pedersen_hash state_hash ", hex(pedersen_hash(pedersen_hash(pedersen_hash(0x21a7f43387573b68666669a0ed764252ce5367708e696e31967764a90b429c2,
#       0x54d89b946081c6556161b34bcd7838c501575a3e9dc3d1d38a4438107b6b8fb), 0x0), 0x0)))


# print("pedersen_hash ", hex(pedersen_hash(
#     0x14d02362d13391cda05cf36cfe6635de96f002342b42ac755ec517e16bcf0fc, 0xecbe2ff7ef5c599c3e28ba8c61c6fafbe35fd8b1b89cf6cfe4fa9fa754bfb1)))
