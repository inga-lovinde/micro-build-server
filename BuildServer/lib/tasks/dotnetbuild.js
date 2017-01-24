"use strict";

const sequential = require("./sequential");

module.exports = (params, processor) => sequential({
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
