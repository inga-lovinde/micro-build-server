"use strict";

import sequential = require("./sequential");

export = (params, processor) => sequential({
    "tasks": [
        {
            "name": "build",
            params,
            "type": "dotnetbuildwithoutcleanup"
        },
        {
            "name": "cleanup",
            "type": "cleanupafterdotnetbuild"
        }
    ]
}, processor);
