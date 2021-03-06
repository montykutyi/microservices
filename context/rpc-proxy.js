"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcProxy = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const execution_context_host_1 = require("@nestjs/core/helpers/execution-context-host");
const operators_1 = require("rxjs/operators");
class RpcProxy {
    create(targetCallback, exceptionsHandler) {
        return async (...args) => {
            try {
                const result = await targetCallback(...args);
                return !this.isObservable(result)
                    ? result
                    : result.pipe(operators_1.catchError(error => this.handleError(exceptionsHandler, args, error)));
            }
            catch (error) {
                return this.handleError(exceptionsHandler, args, error);
            }
        };
    }
    handleError(exceptionsHandler, args, error) {
        const host = new execution_context_host_1.ExecutionContextHost(args);
        host.setType('rpc');
        return exceptionsHandler.handle(error, host);
    }
    isObservable(result) {
        return result && shared_utils_1.isFunction(result.subscribe);
    }
}
exports.RpcProxy = RpcProxy;
