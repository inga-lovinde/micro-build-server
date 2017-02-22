"use strict";

import fs = require("fs");
import path = require("path");

export = (params, processor) => ({
    "process": () => {
        const filePath = path.join(processor.context.exported, params.filename);

        processor.onInfo(`Writing to ${filePath}`);

        fs.writeFile(filePath, params.data, (err) => {
            if (err) {
                processor.onError(`Unable to write file: ${err}`);
            } else {
                processor.onInfo("Written file");
            }

            return processor.done();
        });
    }
});
