"use strict";

const fse = require('fs-extra');

module.exports = (params, processor) => ({
    process: () => {
        const sourceFilePath = processor.context.exported + "/" + params.filename;
        const targetFilePath = processor.context.release + "/" + params.filename;

        processor.onInfo("Copying " + sourceFilePath + " to " + targetFilePath);

        fse.copy(sourceFilePath, targetFilePath, (err) => {
            if (err) {
                processor.onError("Unable to copy file: " + err);
            } else {
                processor.onInfo("Copied file");
            }
            return processor.done();
        });
    }
});
