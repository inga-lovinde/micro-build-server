"use strict";

import * as glob from "glob";

import { GenericTask } from "../types";
import parallel from "./parallel";

const doneFlagName = "uglifyjsallDone";

export default ((_params, processor) => () => {
    if (processor.context.containsFlag(doneFlagName)) {
        processor.onWarn("dotnetnunitall task is executed more than once; this is probably a bug in your mbs.json");
    }

    processor.context.addFlag(doneFlagName);

    glob("**/*.js", {
        cwd: processor.context.exported,
        dot: true,
    }, (err, files) => {
        if (err) {
            processor.onError(err);

            return processor.done();
        }

        return parallel({
            tasks: files.map((file) => ({
                name: file,
                params: { filename: file },
                type: "uglifyjs",
            })),
        }, processor)();
    });
}) as GenericTask<{}>;
