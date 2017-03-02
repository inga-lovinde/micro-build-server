"use strict";

import * as glob from "glob";

import { Task } from "../types";

export default ((params, processor) => () => glob(params.mask, {
    cwd: processor.context.exported,
    dot: true,
}, (err, files) => {
    if (err) {
        processor.onError(err);

        return processor.done();
    }

    if (!files || !files.length) {
        return processor.done();
    }

    return processor.processTask({
        params: {
            tasks: files.map((file) => ({
                name: file,
                params: { filename: file },
                type: "copy",
            })),
        },
        type: "parallel",
    }, processor.done);
})) as Task;
