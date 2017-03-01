"use strict";

import { Task } from "../../types";
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
            type: "cleanupafterdotnetbuild",
        },
    ],
}, processor)) as Task;
