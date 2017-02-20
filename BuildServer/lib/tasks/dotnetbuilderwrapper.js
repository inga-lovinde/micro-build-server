"use strict";

const spawn = require("child_process").spawn;
const streamBuffers = require("stream-buffers");
const settings = require("../../settings");

const wrapBuilder = (builder, input, onExit) => {
    const resultBuffer = new streamBuffers.WritableStreamBuffer();
    const errorBuffer = new streamBuffers.WritableStreamBuffer();

    builder.stdout.on("data", (data) => {
        resultBuffer.write(data);
    });

    builder.stderr.on("data", (data) => {
        errorBuffer.write(data);
    });

    builder.on("exit", (code) => onExit(code, resultBuffer.getContentsAsString(), errorBuffer.getContentsAsString()));

    builder.stdin.write(input);
    builder.stdin.end();
};

module.exports = (params, processor) => ({
    "process": () => {
        const input = JSON.stringify(params);
        const builder = spawn(settings.builderExecutable, [params.command]);

        processor.onInfo(`DotNetBuilderWrapper processing (at ${new Date().toISOString()}): ${input}`);

        wrapBuilder(builder, input, (code, result, error) => {
            if (code) {
                processor.onError(`Return code is ${code}\r\n${error}`);

                return processor.done();
            }

            const report = JSON.parse(result);
            const messages = report.Messages;

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
