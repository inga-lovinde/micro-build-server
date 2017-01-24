"use strict";

const path = require("path");
const sequential = require("./sequential");

module.exports = (params, processor) => sequential({
    "tasks": [
        {
            "params": {
                "BaseDirectory": processor.context.exported,
                "SolutionPath": path.join(processor.context.exported, params.solution),
                "command": "nugetrestore"
            },
            "type": "dotnetbuilderwrapper"
        }
    ]
}, processor);
