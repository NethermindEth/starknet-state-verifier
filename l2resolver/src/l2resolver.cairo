#[contract]
mod L2Resolver {

    struct Storage {
        resolver: LegacyMap::<felt252, felt252>,
    }

    #[view]
    fn resolve(domain_node: felt252) -> felt252 {
        resolver::read(domain_node)
    }

    #[external]
    fn set_starknet_id(domain_node: felt252, starknet_id:felt252 ) {
        resolver::write(domain_node, starknet_id)
    }
}