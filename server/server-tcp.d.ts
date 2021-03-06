/// <reference types="node" />
import { Socket } from 'net';
import { Transport } from '../enums';
import { JsonSocket } from '../helpers/json-socket';
import { CustomTransportStrategy } from '../interfaces';
import { TcpOptions } from '../interfaces/microservice-configuration.interface';
import { Server } from './server';
export declare class ServerTCP extends Server implements CustomTransportStrategy {
    private readonly options;
    readonly transportId = Transport.TCP;
    private readonly port;
    private readonly host;
    private server;
    private isExplicitlyTerminated;
    private retryAttemptsCount;
    constructor(options: TcpOptions['options']);
    listen(callback: () => void): void;
    close(): void;
    bindHandler(socket: Socket): void;
    handleMessage(socket: JsonSocket, rawMessage: unknown): Promise<any>;
    handleClose(): undefined | number | NodeJS.Timer;
    private init;
    private getSocketInstance;
}
