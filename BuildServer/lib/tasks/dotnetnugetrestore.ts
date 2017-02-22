"use strict";

import path = require("path");
import sequential = require("./sequential");

export = (params, processor) => sequential({
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
