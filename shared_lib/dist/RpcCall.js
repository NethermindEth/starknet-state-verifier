"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
// The URL of the JSON-RPC server
var RPC_URL = 'https://pathfinder-goerli.nethermind.io/rpc/v0.2';
// The JSON-RPC version
var JSON_RPC_VERSION = '2.0';
// The next request id
var nextRequestId = 1;
/**
 * Makes a JSON-RPC request to a remote server.
 *
 * @param methodName The name of the method to call
 * @param params The parameters for the method
 * @returns The result of the method call
 */
function jsonRpcCall(rpc_url, methodName, params) {
    if (rpc_url === void 0) { rpc_url = RPC_URL; }
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var request, response1, responseData;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Create the JSON-RPC request object
                    console.log('jsonRpcCall', rpc_url, methodName, params);
                    request = {
                        jsonrpc: JSON_RPC_VERSION,
                        method: methodName,
                        params: params,
                        id: nextRequestId++,
                    };
                    return [4 /*yield*/, fetch(rpc_url, {
                            method: 'POST',
                            body: JSON.stringify(request),
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        })];
                case 1:
                    response1 = _a.sent();
                    return [4 /*yield*/, response1.json()];
                case 2:
                    responseData = _a.sent();
                    return [2 /*return*/, responseData.result];
            }
        });
    });
}
exports.default = jsonRpcCall;
//# sourceMappingURL=RpcCall.js.map