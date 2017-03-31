"use strict";

import { GenericTask } from "../types";
import sequential from "./sequential";

export default ((params, processor) => sequential({
    tasks: [
        {
            name: "build",
            params,
            type: "dotnetbuildwithoutcleanup",
        },
        {
            name: "cleanup",
            params: {},
            type: "cleanupafterdotnetbuild",
        },
    ],
}, processor)) as GenericTask<{}>;
