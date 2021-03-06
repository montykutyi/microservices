import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { Transport } from './enums';
import { ClientOptions } from './interfaces/client-metadata.interface';
import { PatternMetadata } from './interfaces/pattern-metadata.interface';
export interface ClientProperties {
    property: string;
    metadata: ClientOptions;
}
export interface PatternProperties {
    pattern: PatternMetadata;
    methodKey: string;
    isEventHandler: boolean;
    targetCallback: (...args: any[]) => any;
    transport?: Transport;
}
export interface MessageRequestProperties {
    requestPattern: PatternMetadata;
    replyPattern: PatternMetadata;
}
export declare class ListenerMetadataExplorer {
    private readonly metadataScanner;
    constructor(metadataScanner: MetadataScanner);
    explore(instance: Controller): PatternProperties[];
    exploreMethodMetadata(instancePrototype: object, methodKey: string): PatternProperties;
    scanForClientHooks(instance: Controller): IterableIterator<ClientProperties>;
}
