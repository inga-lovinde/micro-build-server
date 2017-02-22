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
            "name": "test",
            params,
            "type": "dotnetnunitall"
        },
        {
            "name": "cleanup",
            "type": "cleanupafterdotnetbuild"
        }
    ]
}, processor);
