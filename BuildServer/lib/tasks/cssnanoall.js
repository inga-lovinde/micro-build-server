"use strict";

const glob = require("glob");

module.exports = (params, processor) => ({
    "process": () => {
        if (processor.context.cssnanoallDone) {
            processor.onWarn("cssnanoall task is executed more than once; this is probably a bug in your mbs.json");
        }

        processor.context.cssnanoallDone = true;

        glob("**/*.css", {
            "cwd": processor.context.exported,
            "dot": true
        }, (err, files) => {
            if (err) {
                processor.onError(err);

                return processor.done();
            }

            return processor.processTask({
                "params": {
                    "tasks": files.map((file) => ({
                        "name": file,
                        "params": { "filename": file },
                        "type": "cssnano"
                    }))
                },
                "type": (params.preventParallelTests && "sequential") || "parallel"
            }, processor.done.bind(processor));
        });
    }
});