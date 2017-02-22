"use strict";

import { join } from "path";
import { remove } from "fs-extra";

export default (params, processor) => ({
    "process": () => {
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
    }
});
