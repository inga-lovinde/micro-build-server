/* tslint:disable:max-classes-per-file variable-name */
declare module "stream-buffers" {
    import * as stream from "stream";

    export class ReadableStreamBuffer extends stream.Readable {
        public constructor(options: { chunkSize: number, frequency: number });
        public put(data: string): void;
        public stop(): void;
    }

    export class WritableStreamBuffer extends stream.Writable {
        public getContentsAsString(): string;
    }
}
