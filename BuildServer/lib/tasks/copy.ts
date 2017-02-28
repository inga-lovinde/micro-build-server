"use strict";

import { copy } from "fs-extra";
import { join } from "path";

export default ((params, processor) => ({
    process: () => {
        const sourceFilePath = join(processor.context.exported, params.filename);
        const targetFilePath = join(processor.context.release, params.filename);

        processor.onInfo(`Copying ${sourceFilePath} to ${targetFilePath}`);

        copy(sourceFilePath, targetFilePath, (err) => {
            if (err) {
                processor.onError(`Unable to copy file: ${err}`);
            } else {
                processor.onInfo("Copied file");
            }

            return processor.done();
        });
    },
})) as Task;
