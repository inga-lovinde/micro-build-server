"use strict";

import path = require("path");
import { CLIEngine } from "eslint";
import settings = require("../../settings");
const cli = new CLIEngine({ "configFile": settings.eslintBrowserConfig });

const errorSeverity = 2;

export = (params, processor) => ({
    "process": () => {
        const filePath = path.join(processor.context.exported, params.filename);
        const result = cli.executeOnFiles([filePath]);

        processor.onInfo(`ESLinted ${params.filename}`);

        result.results.forEach((subresult) => {
            subresult.messages.forEach((message) => {
                const messageText = `${params.filename}:${message.line},${message.column} (${message.ruleId}) ${message.message}`;

                if (message.fatal || message.severity === errorSeverity) {
                    processor.onError(messageText);
                } else {
                    processor.onWarn(messageText);
                }
            });
        });

        processor.done();
    }
});

