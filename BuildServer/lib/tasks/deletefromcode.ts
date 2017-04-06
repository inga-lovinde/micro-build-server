"use strict";

import { remove } from "fs-extra";
import { join } from "path";

import { GenericTask } from "../types";

export default ((params) => (processor) => () => {
    const sourceFilePath = join(processor.context.exported, params.filename);

    processor.onInfo(`Deleting ${sourceFilePath}`);

    remove(sourceFilePath, (err) => {
        if (err) {
            processor.onError(`Unable to delete file: ${err}`);
        } else {
            processor.onInfo("Deleted file");
        }

        return processor.done();
    });
}) as GenericTask<{ readonly filename: string }>;
