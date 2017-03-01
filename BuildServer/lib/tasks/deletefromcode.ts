"use strict";

import { remove } from "fs-extra";
import { join } from "path";

export default ((params, processor) => () => {
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
}) as Task;
