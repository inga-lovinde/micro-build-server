"use strict";

import { spawn } from "child_process";
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

const safeParseJson = (data):any => {
    try {
        return { "parsed": JSON.parse(data) };
    } catch (err) {
        return { err };
    }
};

export default (params, processor) => ({
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
