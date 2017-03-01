"use strict";

import * as glob from "glob";
const flagDoneName = "dotnetnunitallDone";

export default ((params, processor) => () => {
    if (processor.context.containsFlag(flagDoneName)) {
        processor.onWarn("dotnetnunitall task is executed more than once; this is probably a bug in your mbs.json");
    }

    processor.context.addFlag(flagDoneName);

    glob("**/{bin,build}/**/*.{Tests,Test,UnitTests}.dll", {
        cwd: processor.context.exported,
        dot: true,
    }, (err, files) => {
        if (err) {
            processor.onError(err);

            return processor.done();
        }

        if (!files || !files.length) {
            processor.onError(`No test assemblies found in ${processor.context.exported}`);

            return processor.done();
        }

        return processor.processTask({
            params: {
                tasks: files.map((file) => ({
                    name: file,
                    params: { assembly: file },
                    type: "dotnetnunit",
                })),
            },
            type: (params.preventParallelTests && "sequential") || "parallel",
        }, processor.done);
    });
}) as Task;
