"use strict";

import fs = require("fs");
import path = require("path");
import UglifyJS = require("uglify-js");

export = (params, processor) => ({
    "process": () => {
        const filePath = path.normalize(path.join(processor.context.exported, params.filename));
        const result = UglifyJS.minify(filePath);

        fs.writeFile(filePath, result.code, (err) => {
            if (err) {
                processor.onError(`Unable to write uglified script for ${params.filename}: ${err}`);
            } else {
                processor.onInfo(`Saved uglified script for ${params.filename}; uglified length: ${result.code.length}`);
            }

            processor.done();
        });
    }
});

