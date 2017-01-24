"use strict";

const path = require("path");
const sequential = require("./sequential");

const addPostfix = (version, params, processor) => {
    if (params.withoutCommitSha) {
        return version;
    }

    return `${version}-r${processor.context.rev.substr(0, 16)}`;
};

module.exports = (params, processor) => {
    const date = new Date();
    const major = params.major || "0";
    const minor = (date.getFullYear() * 10000) + ((date.getMonth() + 1) * 100) + date.getDate();
    const build = (date.getHours() * 10000) + (date.getMinutes() * 100) + date.getSeconds();
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
            {
                "params": { "Package": nupkg },
                "type": "dotnetnugetpushonly"
            }
        ]
    }, processor);
};
