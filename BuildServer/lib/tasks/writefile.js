"use strict";

const fs = require("fs");
const path = require("path");

module.exports = (params, processor) => ({
    "process": () => {
        const filePath = path.join(processor.context.exported, params.filename);

        processor.onInfo(`Writing to ${filePath}`);

        fs.writeFile(filePath, params.data, (err) => {
            if (err) {
                processor.onError(`Unable to write file: ${err}`);
            } else {
                processor.onInfo("Written file");
            }

            return processor.done();
        });
    }
});
