"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListenersController = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const context_id_factory_1 = require("@nestjs/core/helpers/context-id-factory");
const execution_context_host_1 = require("@nestjs/core/helpers/execution-context-host");
const constants_1 = require("@nestjs/core/injector/constants");
const metadata_scanner_1 = require("@nestjs/core/metadata-scanner");
const request_constants_1 = require("@nestjs/core/router/request/request-constants");
const request_context_host_1 = require("./context/request-context-host");
const rpc_metadata_constants_1 = require("./context/rpc-metadata-constants");
const listener_metadata_explorer_1 = require("./listener-metadata-explorer");
const server_1 = require("./server");
class ListenersController {
    constructor(clientsContainer, contextCreator, container, injector, clientFactory, exceptionFiltersContext) {
        this.clientsContainer = clientsContainer;
        this.contextCreator = contextCreator;
        this.container = container;
        this.injector = injector;
        this.clientFactory = clientFactory;
        this.exceptionFiltersContext = exceptionFiltersContext;
        this.metadataExplorer = new listener_metadata_explorer_1.ListenerMetadataExplorer(new metadata_scanner_1.MetadataScanner());
        this.exceptionFiltersCache = new WeakMap();
    }
    registerPatternHandlers(instanceWrapper, server, moduleKey) {
        const { instance } = instanceWrapper;
        const isStatic = instanceWrapper.isDependencyTreeStatic();
        const patternHandlers = this.metadataExplorer.explore(instance);
        const moduleRef = this.container.getModuleByKey(moduleKey);
        const defaultCallMetadata = server instanceof server_1.ServerGrpc
            ? rpc_metadata_constants_1.DEFAULT_GRPC_CALLBACK_METADATA
            : rpc_metadata_constants_1.DEFAULT_CALLBACK_METADATA;
        patternHandlers
            .filter(({ transport }) => shared_utils_1.isUndefined(transport) ||
            shared_utils_1.isUndefined(server.transportId) ||
            transport === server.transportId)
            .forEach(({ pattern, targetCallback, methodKey, transport, isEventHandler }) => {
            if (isStatic) {
                const proxy = this.contextCreator.create(instance, targetCallback, moduleKey, methodKey, constants_1.STATIC_CONTEXT, undefined, defaultCallMetadata);
                return server.addHandler(pattern, proxy, isEventHandler);
            }
            const asyncHandler = this.createRequestScopedHandler(instanceWrapper, pattern, moduleRef, moduleKey, methodKey, defaultCallMetadata);
            server.addHandler(pattern, asyncHandler, isEventHandler);
        });
    }
    assignClientsToProperties(instance) {
        for (const { property, metadata, } of this.metadataExplorer.scanForClientHooks(instance)) {
            const client = this.clientFactory.create(metadata);
            this.clientsContainer.addClient(client);
            this.assignClientToInstance(instance, property, client);
        }
    }
    assignClientToInstance(instance, property, client) {
        Reflect.set(instance, property, client);
    }
    createRequestScopedHandler(wrapper, pattern, moduleRef, moduleKey, methodKey, defaultCallMetadata = rpc_metadata_constants_1.DEFAULT_CALLBACK_METADATA) {
        const collection = moduleRef.controllers;
        const { instance } = wrapper;
        return async (...args) => {
            try {
                const [data, reqCtx] = args;
                const request = request_context_host_1.RequestContextHost.create(pattern, data, reqCtx);
                const contextId = this.getContextId(request);
                this.container.registerRequestProvider(request, contextId);
                const contextInstance = await this.injector.loadPerContext(instance, moduleRef, collection, contextId);
                const proxy = this.contextCreator.create(contextInstance, contextInstance[methodKey], moduleKey, methodKey, contextId, wrapper.id, defaultCallMetadata);
                return proxy(...args);
            }
            catch (err) {
                let exceptionFilter = this.exceptionFiltersCache.get(instance[methodKey]);
                if (!exceptionFilter) {
                    exceptionFilter = this.exceptionFiltersContext.create(instance, instance[methodKey], moduleKey);
                    this.exceptionFiltersCache.set(instance[methodKey], exceptionFilter);
                }
                const host = new execution_context_host_1.ExecutionContextHost(args);
                host.setType('rpc');
                return exceptionFilter.handle(err, host);
            }
        };
    }
    getContextId(request) {
        const contextId = context_id_factory_1.ContextIdFactory.getByRequest(request);
        if (!request[request_constants_1.REQUEST_CONTEXT_ID]) {
            Object.defineProperty(request, request_constants_1.REQUEST_CONTEXT_ID, {
                value: contextId,
                enumerable: false,
                writable: false,
                configurable: false,
            });
            this.container.registerRequestProvider(request, contextId);
        }
        return contextId;
    }
}
exports.ListenersController = ListenersController;
