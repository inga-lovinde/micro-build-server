"use strict";

import { CLIEngine } from "eslint";
import { join } from "path";

import rawSettings from "../../settings";
import { Settings, Task } from "../../types";

const settings: Settings = rawSettings;

const errorSeverity = 2;

export default ((params, processor) => () => {
    if (settings.isCodeAnalysisUnsupported) {
        return;
    }

    const cli = new CLIEngine({ configFile: settings.eslintBrowserConfig });

    const filePath = join(processor.context.exported, params.filename);
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
}) as Task;
