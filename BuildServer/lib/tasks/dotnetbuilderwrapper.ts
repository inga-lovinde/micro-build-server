"use strict";

import { spawn } from "child_process";
import * as JSONParse from "json-parse-safe";
import { WritableStreamBuffer } from "stream-buffers";

import settings from "../../settings";

const wrapBuilder = (builder, input, onExit) => {
    const resultBuffer = new WritableStreamBuffer();
    const errorBuffer = new WritableStreamBuffer();

    builder.stdout.on("data", (data) => {
        resultBuffer.write(data);
    });

    builder.stderr.on("data", (data) => {
        errorBuffer.write(data);
    });

    builder.on("exit", (code) => {
        resultBuffer.end();
        errorBuffer.end();
        onExit(code, resultBuffer.getContentsAsString(), errorBuffer.getContentsAsString());
    });

    builder.stdin.write(input);
    builder.stdin.end();
};

export default ((params, processor) => () => {
    const input = JSON.stringify(params);
    const builder = spawn(settings.builderExecutable, [params.command]);

    processor.onInfo(`DotNetBuilderWrapper processing (at ${new Date().toISOString()}): ${input}`);

    wrapBuilder(builder, input, (code, result, builderError) => {
        if (code || builderError) {
            processor.onError(`Return code is ${code}\r\n${builderError}`);

            return processor.done();
        }

        const { value, error } = JSONParse(result);

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
}) as Task;
