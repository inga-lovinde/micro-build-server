"use strict";

const fse = require('fs-extra');

module.exports = function (params, processor) {
    return {
        process: () => {
            var sourceFilePath = processor.context.exported + "/" + params.filename;

            processor.onInfo("Deleting " + sourceFilePath);

            fse.remove(sourceFilePath, function(err) {
                if (err) {
                    processor.onError("Unable to delete file: " + err);
                } else {
                    processor.onInfo("Deleted file");
                }
                return processor.done();
            });
        }
    };
};
