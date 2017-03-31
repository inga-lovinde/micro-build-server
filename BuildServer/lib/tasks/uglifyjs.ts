"use strict";

import { writeFile } from "fs";
import { join, normalize } from "path";
import { minify } from "uglify-js";

import { GenericTask } from "../types";

export default ((params, processor) => () => {
    const filePath = normalize(join(processor.context.exported, params.filename));
    const result = minify(filePath);

    writeFile(filePath, result.code, (err) => {
        if (err) {
            processor.onError(`Unable to write uglified script for ${params.filename}: ${err}`);
        } else {
            processor.onInfo(`Saved uglified script for ${params.filename}; uglified length: ${result.code.length}`);
        }

        processor.done();
    });
}) as GenericTask<{ readonly filename: string }>;
