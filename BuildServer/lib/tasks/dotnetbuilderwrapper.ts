"use strict";

import { ChildProcess, spawn } from "child_process";
import * as JSONParse from "json-parse-safe";
import { WritableStreamBuffer } from "stream-buffers";

import { BuilderRequest, GenericTask } from "../types";

interface IDotNetBuilderResponseMessage {
    readonly Type: string;
    readonly Body: string;
}

interface IDotNetBuilderResponse {
    readonly Messages: IDotNetBuilderResponseMessage[];
}

const wrapBuilder = (builder: ChildProcess, input: string, onExit: (code: number, result: string, builderError: string) => void) => {
    const stdoutPromise = new Promise((resolve, reject) => {
        const streamBuffer = new WritableStreamBuffer();
        builder.stdout
            .on("error", reject)
            .pipe(streamBuffer)
            .on("error", reject)
            .on("finish", () => {
                streamBuffer.end();
                resolve(streamBuffer.getContentsAsString());
            });
    });

    const stderrPromise = new Promise((resolve, reject) => {
        const streamBuffer = new WritableStreamBuffer();
        builder.stderr
            .on("error", reject)
            .pipe(streamBuffer)
            .on("error", reject)
            .on("finish", () => {
                streamBuffer.end();
                resolve(streamBuffer.getContentsAsString());
            });
    });

    const builderPromise = new Promise((resolve) => {
        builder.stdin.write(input);
        builder.stdin.end();
        builder.on("exit", resolve);
    });

    Promise.all([stdoutPromise, stderrPromise, builderPromise]).then((values) => {
        const [result, builderError, code] = values;
        onExit(code as number, result as string, builderError as string);
    }).catch((err) => onExit(0, "", err));
};

export default ((params) => (processor) => () => {
    const input = JSON.stringify(params);
    const builder = spawn(processor.settings.builderExecutable, [params.command]);

    processor.onInfo(`DotNetBuilderWrapper processing (at ${new Date().toISOString()}): ${input}`);

    wrapBuilder(builder, input, (code, result, builderError) => {
        if (code || builderError) {
            processor.onError(`Return code is ${code}\r\n${builderError}`);

            return processor.done();
        }

        const { value, error }: { value: IDotNetBuilderResponse, error: any } = JSONParse(result);

        if (error || !value || !value.Messages) {
            processor.onError(`Malformed JSON: ${error}`);
            processor.onInfo(result);

            return processor.done();
        }

        const messages = value.Messages;

        messages.forEach((message) => {
            if (!message) {
                return processor.onError("Message is null");
            }

            switch (message.Type) {
            case "info":
                return processor.onInfo(message.Body);
            case "warn":
                return processor.onWarn(message.Body);
            default:
                return processor.onError(message.Body);
            }
        });

        processor.onInfo(`Done DotNetBuilderWrapper processing (at ${new Date().toISOString()})`);

        return processor.done();
    });
}) as GenericTask<BuilderRequest>;
