"use strict";

import sequential from "./sequential";

export default ((params, processor) => sequential({
    tasks: [
        {
            name: "build",
            params,
            type: "dotnetbuildwithoutcleanup",
        },
        {
            name: "test",
            params,
            type: "dotnetnunitall",
        },
        {
            name: "cleanup",
            type: "cleanupafterdotnetbuild",
        },
    ],
}, processor)) as Task;
