"use strict";

const path = require("path");
const sequential = require("./sequential");

const postfixLength = 16;
const fourDigits = 10000;
const twoDigits = 100;

const addPostfix = (version, params, processor) => {
    if (params.withoutCommitSha) {
        return version;
    }

    return `${version}-r${processor.context.rev.substr(0, postfixLength)}`;
};

module.exports = (params, processor) => {
    const date = new Date();
    const major = params.major || "0";
    const minor = (date.getFullYear() * fourDigits) + ((date.getMonth() + 1) * twoDigits) + date.getDate();
    const build = (date.getHours() * fourDigits) + (date.getMinutes() * twoDigits) + date.getSeconds();
    const version = addPostfix(params.version || `${major}.${minor}.${build}`, params, processor);
    const nupkg = `${params.name}.${version}.nupkg`;

    return sequential({
        "tasks": [
            {
                "params": {
                    "BaseDirectory": processor.context.exported,
                    "OutputDirectory": processor.context.exported,
                    "SpecPath": path.join(processor.context.exported, params.nuspec),
                    "Version": version,
                    "command": "nugetpack"
                },
                "type": "dotnetbuilderwrapper"
            },
            params.getFinalTask(nupkg)
        ]
    }, processor);
};