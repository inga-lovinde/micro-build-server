"use strict";

const glob = require("glob");

module.exports = (params, processor) => ({
    "process": () => {
        if (processor.context.eslintbrowserallDone) {
            processor.onWarn("eslintbrowserall task is executed more than once; this is probably a bug in your mbs.json");
        }

        processor.context.eslintbrowserallDone = true;

        const excludeFiles = params.excludeFiles || [];

        glob("**/*.js", {
            "cwd": processor.context.exported,
            "dot": true
        }, (err, files) => {
            if (err) {
                processor.onError(err);

                return processor.done();
            }

            return processor.processTask({
                "params": {
                    "tasks": files.filter((file) => !excludeFiles.includes(file)).map((file) => ({
                        "name": file,
                        "params": { "filename": file },
                        "type": "eslintbrowser"
                    }))
                },
                "type": (params.preventParallelTests && "sequential") || "parallel"
            }, processor.done.bind(processor));
        });
    }
});
