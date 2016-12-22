"use strict";

const spawn = require('child_process').spawn;
const settings = require("../../settings");

module.exports = (params, processor) => ({
    process: () => {
        let result = "";
        let error = "";
        const builder = spawn(settings.builderExecutable, [params.command]);

        processor.onInfo("DotNetBuilderWrapper processing (at " + (new Date().toISOString()) + "): " + JSON.stringify(params, null, 4));

        builder.stdout.on('data', (data) => result += data);
        builder.stderr.on('data', (data) => error += data);
        builder.on('exit', (code) => {
            if (code !== 0) {
                error = "Return code is " + code + "\r\n" + error;
                processor.onError(error);
                return processor.done();
            }

            const report = JSON.parse(result);
            const messages = report.Messages;
            messages.forEach((message) => {
                if (!message) {
                    return processor.onError("Message is null");
                }

                switch(message.Type) {
                    case "info":
                        return processor.onInfo(message.Body);
                    case "warn":
                        return processor.onWarn(message.Body);
                    default:
                        return processor.onError(message.Body);
                }
            });

            processor.onInfo("Done DotNetBuilderWrapper processing (at " + (new Date().toISOString()) + ")");
            return processor.done();
        });

        builder.stdin.write(JSON.stringify(params));
        builder.stdin.end();
    }
});
