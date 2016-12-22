"use strict";

const sequential = require('./sequential');

module.exports = (params, processor) => {
    const date = new Date();
    const version = (params.version || ((params.major || "0") + "." + (date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()) + "." + ((date.getHours() * 100 + date.getMinutes()) * 100 + date.getSeconds()))) + (params.withoutCommitSha ? "" : ("-r" + processor.context.rev.substr(0, 16)));

    return sequential({
        tasks: [
            {
                type: "dotnetbuilderwrapper",
                params: {
                    command: "nugetpack",
                    BaseDirectory: processor.context.exported,
                    SpecPath: processor.context.exported + "/" + params.nuspec,
                    OutputDirectory: processor.context.exported,
                    Version: version
                }
            },
            {
                type: "copy",
                params: {
                    filename: params.name + "." + version + ".nupkg"
                }
            }
        ]
    }, processor);
};
