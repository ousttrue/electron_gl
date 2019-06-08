export class JsonRpcRequest {
    jsonrpc = "2.0";
    id: number;
    method: string;
    params: any[];
    constructor(id: number, method: string, args: any[]) {
        this.id = id;
        this.method = method;
        this.params = args;
    }
}

function isJsonRpcRequest(value: any): value is JsonRpcRequest {
    return 'id' in value && 'params' in value;
}

export class JsonRpcResponse {
    jsonrpc = "2.0";
    id: number;
    result: any;
    error: any;
    constructor(id: number, result: any, error: any) {
        this.id = id;
        this.result = result;
        this.error = error;
    }
}

function isJsonRpcResponse(value: any): value is JsonRpcResponse {
    return 'id' in value && ('response' in value || 'error' in value);
}

export class JsonRpcNotify {
    jsonrpc = "2.0";
    method: string;
    params: any[];
    constructor(method: string, params: any[]) {
        this.method = method;
        this.params = params;
    }
}

function isJsonRpcNotify(value: any): value is JsonRpcNotify{
    return !('id' in value) && ('method' in value);
}


export class ResolveReject {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    constructor(resolve: (value: any) => void, reject: (error: any) => void) {
        this.resolve = resolve;
        this.reject = reject;
    }
}

export class RPC {
    nextRequestId = 1;
    requestMap: { [key: number]: ResolveReject } = {};
    methodMap: { [key: string]: (...params: any[])=>any} = {};

    createRequest(method: string, ...args: any[]): [JsonRpcRequest, Promise<any>] {
        const request = new JsonRpcRequest(this.nextRequestId++, method, args);
        const promise = new Promise((resolve, reject) => {
            this.requestMap[request.id] = new ResolveReject(resolve, reject);
        });
        return [request, promise];
    }

    async dispatchAsync(value: any): Promise<JsonRpcResponse|null> {
        if(isJsonRpcRequest(value)){

            try{
                const method = this.methodMap[value.method];
                if(!method){
                    throw "no method: " + value.method;
                }

                var result = await method(...value.params);
                return new JsonRpcResponse(value.id, result, null);
            }
            catch(e)
            {
                return new JsonRpcResponse(value.id, null, e);
            }

        }
        else if(isJsonRpcResponse(value)){

            const request = this.requestMap[value.id];
            if(value.error)
            {
                // error
                request.reject(value.error);
            }
            else{
                // success
                request.resolve(value.result);
            }
            return null;

        }
        else if(isJsonRpcNotify(value)){

            const method = this.methodMap[value.method];
            if (!method) {
                throw "no method: " + value.method;
            }

            await method(...value.params);

            return null;

        }
        else{
            throw "invalid message: " + value;
        }
    }
}