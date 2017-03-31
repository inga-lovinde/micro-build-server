"use strict";

import * as glob from "glob";

import { GenericTask } from "../types";
import parallel from "./parallel";

export default ((_params, processor) => () => glob("**/obj/{Debug,Release}/*.{dll,pdb,xml}", {
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
            type: "deletefromcode",
        })),
    }, processor)();
})) as GenericTask<{}>;
