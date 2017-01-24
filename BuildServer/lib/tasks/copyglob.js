"use strict";

const glob = require("glob");

module.exports = (params, processor) => ({
    "process": () => glob(params.mask, {
        "cwd": processor.context.exported,
        "dot": true
    }, (err, files) => {
        if (err) {
            processor.onError(err);

            return processor.done();
        }

        if (!files || !files.length) {
            return processor.done();
        }

        return processor.processTask({
            "params": {
                "tasks": files.map((file) => ({
                    "name": file,
                    "params": { "filename": file },
                    "type": "copy"
                }))
            },
            "type": "parallel"
        }, processor.done.bind(processor));
    })
});
