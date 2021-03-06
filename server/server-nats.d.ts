import { Transport } from '../enums';
import { Client } from '../external/nats-client.interface';
import { CustomTransportStrategy } from '../interfaces';
import { NatsOptions } from '../interfaces/microservice-configuration.interface';
import { Server } from './server';
export declare class ServerNats extends Server implements CustomTransportStrategy {
    private readonly options;
    readonly transportId = Transport.NATS;
    private readonly url;
    private natsClient;
    constructor(options: NatsOptions['options']);
    listen(callback: () => void): void;
    start(callback?: () => void): void;
    bindEvents(client: Client): void;
    close(): void;
    createNatsClient(): Client;
    getMessageHandler(channel: string, client: Client): Function;
    handleMessage(channel: string, rawMessage: any, client: Client, replyTo: string, callerSubject: string): Promise<any>;
    getPublisher(publisher: Client, replyTo: string, id: string): (response: any) => void;
    handleError(stream: any): void;
}
