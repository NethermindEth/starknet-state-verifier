%lang starknet
from src.main import resolver, initializer, resolve, set_starknet_id
from starkware.cairo.common.cairo_builtins import HashBuiltin

@external
func test_resolve{syscall_ptr: felt*, range_check_ptr, pedersen_ptr: HashBuiltin*}() {
    resolver.write('node_hash', 123);

    let (resolved_starknet_id) = resolve('node_hash');
    assert resolved_starknet_id = 123;

    let (default_resolved_starknet_id) = resolve('other_node_hash');
    assert default_resolved_starknet_id = 0;
    return ();
}

@external
func test_set_starknet_id{syscall_ptr: felt*, range_check_ptr, pedersen_ptr: HashBuiltin*}() {
    set_starknet_id('node_hash', 123, 0, new ());
    let (starknet_id) = resolver.read('node_hash');
    assert starknet_id = 123;

    return ();
}
