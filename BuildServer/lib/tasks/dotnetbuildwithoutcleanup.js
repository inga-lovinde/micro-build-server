"use strict";

const sequential = require("./sequential");

module.exports = (params, processor) => {
    const tasks = [];

    if (!params.skipMbsCheckStyle) {
        tasks.push({
            params,
            "type": "dotnetcheckstyle"
        });
    }

    tasks.push({
        params,
        "type": "dotnetrewrite"
    });

    if (!params.skipNugetRestore) {
        tasks.push({
            params,
            "type": "dotnetnugetrestore"
        });
    }

    tasks.push({
        "params": {
            "configuration": params.configuration,
            "forceCodeAnalysis": params.forceCodeAnalysis,
            "ignoreCodeAnalysis": params.ignoreCodeAnalysis,
            "skipCodeSigning": params.skipCodeSigning,
            "solution": params.solution,
            "target": "Rebuild"
        },
        "type": "dotnetcompile"
    });

    return sequential({ tasks }, processor);
};
