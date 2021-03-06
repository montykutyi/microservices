import { Logger } from '@nestjs/common/services/logger.service';
import { Client } from '../external/nats-client.interface';
import { NatsOptions, PacketId, ReadPacket, WritePacket } from '../interfaces';
import { ClientProxy } from './client-proxy';
export declare class ClientNats extends ClientProxy {
    protected readonly options: NatsOptions['options'];
    protected readonly logger: Logger;
    protected readonly url: string;
    protected natsClient: Client;
    protected connection: Promise<any>;
    constructor(options: NatsOptions['options']);
    close(): void;
    connect(): Promise<any>;
    createClient(): Client;
    handleError(client: Client): void;
    createSubscriptionHandler(packet: ReadPacket & PacketId, callback: (packet: WritePacket) => any): Function;
    protected publish(partialPacket: ReadPacket, callback: (packet: WritePacket) => any): Function;
    protected dispatchEvent(packet: ReadPacket): Promise<any>;
}
