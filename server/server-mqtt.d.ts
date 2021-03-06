/// <reference types="node" />
import { Transport } from '../enums';
import { MqttClient } from '../external/mqtt-client.interface';
import { CustomTransportStrategy, MessageHandler, PacketId, ReadPacket } from '../interfaces';
import { MqttOptions } from '../interfaces/microservice-configuration.interface';
import { Server } from './server';
export declare class ServerMqtt extends Server implements CustomTransportStrategy {
    private readonly options;
    readonly transportId = Transport.MQTT;
    private readonly url;
    private mqttClient;
    constructor(options: MqttOptions['options']);
    listen(callback: () => void): Promise<void>;
    start(callback?: () => void): void;
    bindEvents(mqttClient: MqttClient): void;
    close(): void;
    createMqttClient(): MqttClient;
    getMessageHandler(pub: MqttClient): Function;
    handleMessage(channel: string, buffer: Buffer, pub: MqttClient, originalPacket?: Record<string, any>): Promise<any>;
    getPublisher(client: MqttClient, pattern: any, id: string): any;
    parseMessage(content: any): ReadPacket & PacketId;
    matchMqttPattern(pattern: string, topic: string): boolean;
    getHandlerByPattern(pattern: string): MessageHandler | null;
    getRequestPattern(pattern: string): string;
    getReplyPattern(pattern: string): string;
    handleError(stream: any): void;
}
