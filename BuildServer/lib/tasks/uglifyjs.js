"use strict";

const fs = require('fs');
const path = require('path');
const UglifyJS = require("uglify-js");

module.exports = (params, processor) => ({
    process: () => {
        const filePath = path.normalize(processor.context.exported + "/" + params.filename);
        const result = UglifyJS.minify(filePath);
        fs.writeFile(filePath, result.code, (err) => {
            if (err) {
                processor.onError("Unable to write uglified script for " + params.filename + ": " + err);
            } else {
                processor.onInfo("Saved uglified script for " + params.filename + "; uglified length: " + result.code.length);
            }

            processor.done();
        });
    }
});

