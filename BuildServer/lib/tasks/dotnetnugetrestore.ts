"use strict";

import { join } from "path";
import sequential from "./sequential";

export default (params, processor) => sequential({
    "tasks": [
        {
            "params": {
                "BaseDirectory": processor.context.exported,
                "SolutionPath": join(processor.context.exported, params.solution),
                "command": "nugetrestore"
            },
            "type": "dotnetbuilderwrapper"
        }
    ]
}, processor);
