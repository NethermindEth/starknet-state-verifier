/**
 * Makes a JSON-RPC request to a remote server.
 *
 * @param methodName The name of the method to call
 * @param params The parameters for the method
 * @returns The result of the method call
 */
declare function jsonRpcCall(rpc_url: string | undefined, methodName: string, params: any[]): Promise<any>;
export default jsonRpcCall;
//# sourceMappingURL=RpcCall.d.ts.map