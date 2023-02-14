"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStarknetProof = exports.parseStarknetProof = void 0;
var tslib_1 = require("tslib");
var RpcCall_1 = tslib_1.__importDefault(require("./RpcCall"));
function parseProofElement(element) {
    // console.log(element)
    if (element.binary != undefined) {
        return {
            nodeType: 0,
            binaryProof: {
                leftHash: element.binary.left,
                rightHash: element.binary.right,
            },
            edgeProof: {
                childHash: 0,
                path: 0,
                length: 0,
            },
        };
    }
    else if (element.edge != undefined) {
        return {
            nodeType: 1,
            binaryProof: {
                leftHash: 0,
                rightHash: 0,
            },
            edgeProof: {
                childHash: element.edge.child,
                path: element.edge.path.value,
                length: element.edge.path.len,
            },
        };
    }
    else {
        throw new Error("Invalid proof element");
    }
}
function parseStarknetProof(response, contractAddress, storageVarAddress, starknetCommittedBlockNumber) {
    var myCompositeStateProof = {
        blockNumber: 0,
        contractData: {
            contractStateRoot: 0,
            contractAddress: 0,
            storageVarAddress: 0,
            classHash: 0,
            hashVersion: 0,
            nonce: 0,
        },
        contractProofArray: [],
        storageProofArray: [],
    };
    if (response.contract_proof !== undefined) {
        var myContractProofs_1 = [];
        var myStorageproofs_1 = [];
        var StarknetContractData = {};
        response.contract_proof.forEach(function (element) {
            myContractProofs_1.push(parseProofElement(element));
        });
        if (response.contract_data !== undefined) {
            StarknetContractData = {
                contractStateRoot: response.contract_data.root,
                contractAddress: contractAddress,
                storageVarAddress: storageVarAddress,
                classHash: response.contract_data.class_hash,
                hashVersion: response.contract_data.contract_state_hash_version,
                nonce: response.contract_data.nonce
            };
            // console.log('contract data', response.contract_data)
            if (response.contract_data.storage_proofs !== undefined) {
                response.contract_data.storage_proofs.forEach(function (storage_proof) {
                    var myStorageProof = [];
                    storage_proof.forEach(function (element) {
                        myStorageproofs_1.push(parseProofElement(element));
                    });
                });
            }
            myCompositeStateProof = {
                contractProofArray: myContractProofs_1,
                storageProofArray: myStorageproofs_1,
                contractData: StarknetContractData,
                blockNumber: starknetCommittedBlockNumber,
            };
        }
    }
    else {
        throw new Error("Invalid proof response");
    }
    return myCompositeStateProof;
}
exports.parseStarknetProof = parseStarknetProof;
function getStarknetProof(rpc_url, contractAddress, storageVarAddress, starknetCommittedBlockNumber) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var blockArg, args, result, error_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    blockArg = { 'block_number': parseInt(starknetCommittedBlockNumber.toString()) };
                    args = [
                        blockArg,
                        contractAddress,
                        [storageVarAddress]
                    ];
                    return [4 /*yield*/, (0, RpcCall_1.default)(rpc_url, "pathfinder_getProof", args)];
                case 1:
                    result = _a.sent();
                    console.log('result', JSON.stringify(result));
                    return [2 /*return*/, parseStarknetProof(result, contractAddress, storageVarAddress, starknetCommittedBlockNumber)];
                case 2:
                    error_1 = _a.sent();
                    console.log('error', error_1);
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.getStarknetProof = getStarknetProof;
// export default { getStarknetProof }
//# sourceMappingURL=index.js.map