"use strict";

import sequential = require("./sequential");

export = (params, processor) => sequential({
    "tasks": [
        {
            "params": { "excludeFiles": params.eslintExcludeFiles },
            "type": "eslintbrowserall"
        },
        { "type": "uglifyjsall" },
        { "type": "cssnanoall" },
        {
            "params": {
                "data": processor.context.versionInfo,
                "filename": "version.txt"
            },
            "type": "writefile"
        },
        {
            "params": {
                "archive": `${processor.context.reponame}.zip`,
                "directory": ""
            },
            "type": "zip"
        }
    ]
}, processor);
