"use strict";

import * as glob from "glob";

import { Task } from "../types";

const flagDoneName = "cssnanoallDone";

export default ((params, processor) => () => {
    if (processor.context.containsFlag(flagDoneName)) {
        processor.onWarn("cssnanoall task is executed more than once; this is probably a bug in your mbs.json");
    }

    processor.context.addFlag(flagDoneName);

    glob("**/*.css", {
        cwd: processor.context.exported,
        dot: true,
    }, (err, files) => {
        if (err) {
            processor.onError(err);

            return processor.done();
        }

        return processor.processTask({
            params: {
                tasks: files.map((file) => ({
                    name: file,
                    params: { filename: file },
                    type: "cssnano",
                })),
            },
            type: (params.preventParallelTests && "sequential") || "parallel",
        }, processor.done);
    });
}) as Task;
