"use strict";

const conditional = require("./conditional");

module.exports = (params, processor) => conditional({
    "branch": "master",
    "otherwise": {
        "name": "nuget-pack",
        "params": {
            "major": params.major,
            "name": params.nuspecName,
            "nuspec": `${params.nuspecName}.nuspec`,
            "version": params.version,
            "withoutCommitSha": params.withoutCommitSha
        },
        "type": "dotnetnugetpack"
    },
    "owner": params.masterRepoOwner,
    "task": {
        "name": "nuget-push",
        "params": {
            "major": params.major,
            "name": params.nuspecName,
            "nuspec": `${params.nuspecName}.nuspec`,
            "version": params.version,
            "withoutCommitSha": params.withoutCommitSha
        },
        "type": "dotnetnugetpush"
    }
}, processor);
