"use strict";

const path = require("path");
const fse = require("fs-extra");

module.exports = (params, processor) => ({
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
