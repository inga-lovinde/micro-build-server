"use strict";

import fs = require("fs");
import path = require("path");
import cssnano = require("cssnano");

export = (params, processor) => ({
    "process": () => {
        const filePath = path.join(processor.context.exported, params.filename);

        fs.readFile(filePath, (readErr, css) => {
            if (readErr) {
                processor.onError(`Unable to read stylesheet ${params.filename}: ${readErr}`);

                return processor.done();
            }

            return cssnano.process(css)
                .catch((cssErr) => {
                    processor.onError(`Unable to uglify stylesheet: ${cssErr}`);
                    processor.done();
                })
                .then((result) => {
                    fs.writeFile(filePath, result.css, (writeErr) => {
                        if (writeErr) {
                            processor.onError(`Unable to write uglified stylesheet for ${params.filename}: ${writeErr}`);
                        } else {
                            processor.onInfo(`Saved uglified stylesheet for ${params.filename}; uglified length: ${result.css.length}`);
                        }

                        processor.done();
                    });
                });
        });
    }
});

