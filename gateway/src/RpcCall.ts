
// The URL of the JSON-RPC server
const RPC_URL = 'https://pathfinder-goerli.nethermind.io/rpc/v0.2';

// The JSON-RPC version
const JSON_RPC_VERSION = '2.0';

// The next request id
let nextRequestId = 1;

/**
 * Makes a JSON-RPC request to a remote server.
 *
 * @param methodName The name of the method to call
 * @param params The parameters for the method
 * @returns The result of the method call
 */
async function jsonRpcCall(methodName: string, params: any[]): Promise<any> {
  // Create the JSON-RPC request object
  console.log('jsonRpcCall', methodName, params);
  const request = {
    jsonrpc: JSON_RPC_VERSION,
    method: methodName,
    params,
    id: nextRequestId++,
  };

  // Send the request and return the result
  // Make the JSON-RPC call using the fetch function
  const response1 = await fetch(RPC_URL, {
    method: 'POST',
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const responseData = await response1.json();
  return responseData.result;
}

export default jsonRpcCall;