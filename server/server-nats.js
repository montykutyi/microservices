"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerNats = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const constants_1 = require("../constants");
const nats_context_1 = require("../ctx-host/nats.context");
const enums_1 = require("../enums");
const server_1 = require("./server");
let natsPackage = {};
class ServerNats extends server_1.Server {
    constructor(options) {
        super();
        this.options = options;
        this.transportId = enums_1.Transport.NATS;
        this.url = this.getOptionsProp(this.options, 'url') || constants_1.NATS_DEFAULT_URL;
        natsPackage = this.loadPackage('nats', ServerNats.name, () => require('nats'));
        this.initializeSerializer(options);
        this.initializeDeserializer(options);
    }
    listen(callback) {
        this.natsClient = this.createNatsClient();
        this.handleError(this.natsClient);
        this.start(callback);
    }
    start(callback) {
        this.bindEvents(this.natsClient);
        this.natsClient.on(constants_1.CONNECT_EVENT, callback);
    }
    bindEvents(client) {
        const queue = this.getOptionsProp(this.options, 'queue');
        const subscribe = queue
            ? (channel) => client.subscribe(channel, { queue }, this.getMessageHandler(channel, client).bind(this))
            : (channel) => client.subscribe(channel, this.getMessageHandler(channel, client).bind(this));
        const registeredPatterns = [...this.messageHandlers.keys()];
        registeredPatterns.forEach(channel => subscribe(channel));
    }
    close() {
        this.natsClient && this.natsClient.close();
        this.natsClient = null;
    }
    createNatsClient() {
        const options = this.options || {};
        return natsPackage.connect(Object.assign(Object.assign({}, options), { url: this.url, json: true }));
    }
    getMessageHandler(channel, client) {
        return async (buffer, replyTo, callerSubject) => this.handleMessage(channel, buffer, client, replyTo, callerSubject);
    }
    async handleMessage(channel, rawMessage, client, replyTo, callerSubject) {
        const natsCtx = new nats_context_1.NatsContext([callerSubject]);
        const message = this.deserializer.deserialize(rawMessage, {
            channel,
            replyTo,
        });
        if (shared_utils_1.isUndefined(message.id)) {
            return this.handleEvent(channel, message, natsCtx);
        }
        const publish = this.getPublisher(client, replyTo, message.id);
        const handler = this.getHandlerByPattern(channel);
        if (!handler) {
            const status = 'error';
            const noHandlerPacket = {
                id: message.id,
                status,
                err: constants_1.NO_MESSAGE_HANDLER,
            };
            return publish(noHandlerPacket);
        }
        const response$ = this.transformToObservable(await handler(message.data, natsCtx));
        response$ && this.send(response$, publish);
    }
    getPublisher(publisher, replyTo, id) {
        if (replyTo) {
            return (response) => {
                Object.assign(response, { id });
                const outgoingResponse = this.serializer.serialize(response);
                return publisher.publish(replyTo, outgoingResponse);
            };
        }
        // In case "replyTo" topic is not provided, there's no need for a reply.
        // Method returns a noop function instead
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => { };
    }
    handleError(stream) {
        stream.on(constants_1.ERROR_EVENT, (err) => this.logger.error(err));
    }
}
exports.ServerNats = ServerNats;
