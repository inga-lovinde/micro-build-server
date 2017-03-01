"use strict";

import { process as cssnanoProcess } from "cssnano";
import { readFile, writeFile } from "fs";
import { join } from "path";

import { Task } from "../../types";

export default ((params, processor) => () => {
    const filePath = join(processor.context.exported, params.filename);

    readFile(filePath, (readErr, css) => {
        if (readErr) {
            processor.onError(`Unable to read stylesheet ${params.filename}: ${readErr}`);

            return processor.done();
        }

        return cssnanoProcess(css)
            .catch((cssErr) => {
                processor.onError(`Unable to uglify stylesheet: ${cssErr}`);
                processor.done();
            })
            .then((result) => {
                writeFile(filePath, result.css, (writeErr) => {
                    if (writeErr) {
                        processor.onError(`Unable to write uglified stylesheet for ${params.filename}: ${writeErr}`);
                    } else {
                        processor.onInfo(`Saved uglified stylesheet for ${params.filename}; uglified length: ${result.css.length}`);
                    }

                    processor.done();
                });
            });
    });
}) as Task;
