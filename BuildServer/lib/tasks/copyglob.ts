"use strict";

import * as glob from "glob";

import { GenericTask } from "../types";
import parallel from "./parallel";

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

    return parallel({
        tasks: files.map((file) => ({
            name: file,
            params: { filename: file },
            type: "copy",
        })),
    }, processor)();
})) as GenericTask<{ readonly mask: string }>;
