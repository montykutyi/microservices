"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientNats = void 0;
const logger_service_1 = require("@nestjs/common/services/logger.service");
const load_package_util_1 = require("@nestjs/common/utils/load-package.util");
const operators_1 = require("rxjs/operators");
const constants_1 = require("../constants");
const client_proxy_1 = require("./client-proxy");
const constants_2 = require("./constants");
let natsPackage = {};
class ClientNats extends client_proxy_1.ClientProxy {
    constructor(options) {
        super();
        this.options = options;
        this.logger = new logger_service_1.Logger(client_proxy_1.ClientProxy.name);
        this.url = this.getOptionsProp(this.options, 'url') || constants_1.NATS_DEFAULT_URL;
        natsPackage = load_package_util_1.loadPackage('nats', ClientNats.name, () => require('nats'));
        this.initializeSerializer(options);
        this.initializeDeserializer(options);
    }
    close() {
        this.natsClient && this.natsClient.close();
        this.natsClient = null;
        this.connection = null;
    }
    async connect() {
        if (this.natsClient) {
            return this.connection;
        }
        this.natsClient = this.createClient();
        this.handleError(this.natsClient);
        this.connection = await this.connect$(this.natsClient)
            .pipe(operators_1.share())
            .toPromise();
        return this.connection;
    }
    createClient() {
        const options = this.options || {};
        return natsPackage.connect(Object.assign(Object.assign({}, options), { url: this.url, json: true }));
    }
    handleError(client) {
        client.addListener(constants_1.ERROR_EVENT, (err) => err.code !== constants_2.CONN_ERR && this.logger.error(err));
    }
    createSubscriptionHandler(packet, callback) {
        return (rawPacket) => {
            const message = this.deserializer.deserialize(rawPacket);
            if (message.id && message.id !== packet.id) {
                return undefined;
            }
            const { err, response, isDisposed } = message;
            if (isDisposed || err) {
                return callback({
                    err,
                    response,
                    isDisposed: true,
                });
            }
            callback({
                err,
                response,
            });
        };
    }
    publish(partialPacket, callback) {
        try {
            const packet = this.assignPacketId(partialPacket);
            const channel = this.normalizePattern(partialPacket.pattern);
            const serializedPacket = this.serializer.serialize(packet);
            const subscriptionHandler = this.createSubscriptionHandler(packet, callback);
            const subscriptionId = this.natsClient.request(channel, serializedPacket, subscriptionHandler);
            return () => this.natsClient.unsubscribe(subscriptionId);
        }
        catch (err) {
            callback({ err });
        }
    }
    dispatchEvent(packet) {
        const pattern = this.normalizePattern(packet.pattern);
        const serializedPacket = this.serializer.serialize(packet);
        return new Promise((resolve, reject) => this.natsClient.publish(pattern, serializedPacket, err => err ? reject(err) : resolve()));
    }
}
exports.ClientNats = ClientNats;
