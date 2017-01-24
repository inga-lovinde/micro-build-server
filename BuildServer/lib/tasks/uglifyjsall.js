"use strict";

const glob = require("glob");

module.exports = (params, processor) => ({
    "process": () => {
        if (processor.context.uglifyjsallDone) {
            processor.onWarn("dotnetnunitall task is executed more than once; this is probably a bug in your mbs.json");
        }

        processor.context.uglifyjsallDone = true;

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
                    "tasks": files.map((file) => ({
                        "name": file,
                        "params": { "filename": file },
                        "type": "uglifyjs"
                    }))
                },
                "type": (params.preventParallelTests && "sequential") || "parallel"
            }, processor.done.bind(processor));
        });
    }
});
