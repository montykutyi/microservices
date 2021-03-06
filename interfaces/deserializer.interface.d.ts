import { IncomingEvent, IncomingRequest, IncomingResponse } from './packet.interface';
export interface Deserializer<TInput = any, TOutput = any> {
    deserialize(value: TInput, options?: Record<string, any>): TOutput;
}
export declare type ProducerDeserializer = Deserializer<any, IncomingResponse>;
export declare type ConsumerDeserializer = Deserializer<any, IncomingRequest | IncomingEvent>;
