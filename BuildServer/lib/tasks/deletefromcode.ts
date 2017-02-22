"use strict";

import path = require("path");
import fse = require("fs-extra");

export = (params, processor) => ({
    "process": () => {
        const sourceFilePath = path.join(processor.context.exported, params.filename);

        processor.onInfo(`Deleting ${sourceFilePath}`);

        fse.remove(sourceFilePath, (err) => {
            if (err) {
                processor.onError(`Unable to delete file: ${err}`);
            } else {
                processor.onInfo("Deleted file");
            }

            return processor.done();
        });
    }
});
