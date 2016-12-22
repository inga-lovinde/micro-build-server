"use strict";

const sequential = require('./sequential');

module.exports = (params, processor) => {
    let tasks = [];

    if (!params.skipMbsCheckStyle) {
        tasks.push({
            type: "dotnetcheckstyle",
            params: params
        });
    }

    tasks.push({
        type: "dotnetrewrite",
        params: params
    });

    if (!params.skipNugetRestore) {
        tasks.push({
            type: "dotnetnugetrestore",
            params: params
        });
    }

    tasks.push({
        type: "dotnetcompile",
        params: {
            solution: params.solution,
            skipCodeSigning: params.skipCodeSigning,
            forceCodeAnalysis: params.forceCodeAnalysis,
            ignoreCodeAnalysis: params.ignoreCodeAnalysis,
            configuration: params.configuration,
            target: "Rebuild"
        }
    });

    return sequential({
        tasks: tasks
    }, processor);
};
