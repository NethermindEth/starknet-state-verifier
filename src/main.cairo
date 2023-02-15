%lang starknet
from starkware.starknet.common.syscalls import get_caller_address
from starkware.cairo.common.cairo_builtins import HashBuiltin
from cairo_contracts.src.openzeppelin.upgrades.library import Proxy

@storage_var
func resolver(domain_node) -> (starknet_id: felt) {
}

@external
func initializer{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(proxy_admin) {
    Proxy.initializer(proxy_admin);
    return ();
}

@view
func resolve{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(domain_node) -> (
    starknet_id: felt
) {
    return resolver.read(domain_node);
}

@external
func set_starknet_id{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    domain_node, starknet_id: felt, proof_len, proof: felt*
) {
    let (caller) = get_caller_address();
    // todo: assert domain_node was delegated to caller on Ethereum via a storage proof
    resolver.write(domain_node, starknet_id);
    return ();
}

// admin function
@external
func upgrade{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    new_implementation: felt
) {
    Proxy.assert_only_admin();
    Proxy._set_implementation_hash(new_implementation);
    return ();
}
