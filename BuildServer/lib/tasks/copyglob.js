"use strict";

const glob = require('glob');

module.exports = (params, processor) => ({
    process: () => glob(params.mask, {
        dot: true,
        cwd: processor.context.exported
    }, (err, files) => {
        if (err) {
            processor.onError(err);
            return processor.done();
        }

        if (!files || !files.length) {
            return processor.done();
        }

        return processor.processTask({
            type: "parallel",
            params: {
                tasks: files.map((file) => ({
                    name: file,
                    type: "copy",
                    params: {
                        filename: file
                    }
                }))
            }
        }, processor.done.bind(processor));
    })
});
