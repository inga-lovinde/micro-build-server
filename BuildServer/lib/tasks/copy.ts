"use strict";

import path = require("path");
import fse = require("fs-extra");

export = (params, processor) => ({
    "process": () => {
        const sourceFilePath = path.join(processor.context.exported, params.filename);
        const targetFilePath = path.join(processor.context.release, params.filename);

        processor.onInfo(`Copying ${sourceFilePath} to ${targetFilePath}`);

        fse.copy(sourceFilePath, targetFilePath, (err) => {
            if (err) {
                processor.onError(`Unable to copy file: ${err}`);
            } else {
                processor.onInfo("Copied file");
            }

            return processor.done();
        });
    }
});
