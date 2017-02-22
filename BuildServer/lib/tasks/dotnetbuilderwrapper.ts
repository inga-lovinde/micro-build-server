"use strict";

import { spawn } from "child_process";
import streamBuffers = require("stream-buffers");
import settings = require("../../settings");

const wrapBuilder = (builder, input, onExit) => {
    const resultBuffer = new streamBuffers.WritableStreamBuffer();
    const errorBuffer = new streamBuffers.WritableStreamBuffer();

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

const safeParseJson = (data):any => {
    try {
        return { "parsed": JSON.parse(data) };
    } catch (err) {
        return { err };
    }
};

export = (params, processor) => ({
    "process": () => {
        const input = JSON.stringify(params);
        const builder = spawn(settings.builderExecutable, [params.command]);

        processor.onInfo(`DotNetBuilderWrapper processing (at ${new Date().toISOString()}): ${input}`);

        wrapBuilder(builder, input, (code, result, builderError) => {
            if (code || builderError) {
                processor.onError(`Return code is ${code}\r\n${builderError}`);

                return processor.done();
            }

            const { parsed, err } = safeParseJson(result);

            if (err || !parsed || !parsed.Messages) {
                processor.onError(`Malformed JSON: ${err}`);
                processor.onInfo(result);

                return processor.done();
            }

            const messages = parsed.Messages;

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
    }
});
