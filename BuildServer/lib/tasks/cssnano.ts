"use strict";

import { process as cssnanoProcess } from "cssnano";
import { readFile, writeFile } from "fs";
import { join } from "path";

import { GenericTask } from "../types";

export default ((params) => (processor) => () => {
    const filePath = join(processor.context.exported, params.filename);

    readFile(filePath, "utf8", (readErr, css) => {
        if (readErr) {
            processor.onError(`Unable to read stylesheet ${params.filename}: ${readErr}`);

            return processor.done();
        }

        return cssnanoProcess(css)
            .then((result) => {
                writeFile(filePath, result.content, (writeErr) => {
                    if (writeErr) {
                        processor.onError(`Unable to write uglified stylesheet for ${params.filename}: ${writeErr}`);
                    } else {
                        processor.onInfo(`Saved uglified stylesheet for ${params.filename}; uglified length: ${result.content.length}`);
                    }

                    processor.done();
                });
            })
            .catch((cssErr: string) => {
                processor.onError(`Unable to uglify stylesheet: ${cssErr}`);
                processor.done();
            });
    });
}) as GenericTask<{ readonly filename: string }>;
