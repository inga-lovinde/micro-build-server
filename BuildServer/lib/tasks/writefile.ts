"use strict";

import { writeFile } from "fs";
import { join } from "path";

import { GenericTask } from "../types";

interface IParameters {
    readonly data: string;
    readonly filename: string;
}

export default ((params, processor) => () => {
    const filePath = join(processor.context.exported, params.filename);

    processor.onInfo(`Writing to ${filePath}`);

    writeFile(filePath, params.data, (err) => {
        if (err) {
            processor.onError(`Unable to write file: ${err}`);
        } else {
            processor.onInfo("Written file");
        }

        return processor.done();
    });
}) as GenericTask<IParameters>;
