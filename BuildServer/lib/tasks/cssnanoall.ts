"use strict";

import * as glob from "glob";

import { GenericTask } from "../types";
import cssnano from "./cssnano";
import parallel from "./parallel";

const flagDoneName = "cssnanoallDone";

export default ((_params) => (processor) => () => {
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

        return parallel({
            tasks: files.map((file) => ({
                name: file,
                task: cssnano({ filename: file }),
            })),
        })(processor)();
    });
}) as GenericTask<{}>;
