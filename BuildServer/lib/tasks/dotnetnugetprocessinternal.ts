"use strict";

import { join } from "path";

import { GenericTask, TaskInfo, TaskProcessor } from "../types";
import dotnetbuilderwrapper from "./dotnetbuilderwrapper";
import sequential from "./sequential";

interface IDotNetNuGetProcessInternalParameters {
    readonly withoutCommitSha?: boolean;
    readonly major?: string;
    readonly version?: string;
    readonly name: string;
    readonly nuspec: string;
    readonly getFinalTask: (nupkg: string) => TaskInfo;
}

const postfixLength = 16;
const fourDigits = 10000;
const twoDigits = 100;

const addPostfix = (version: string, params: IDotNetNuGetProcessInternalParameters, processor: TaskProcessor) => {
    if (params.withoutCommitSha) {
        return version;
    }

    return `${version}-r${processor.context.rev.substr(0, postfixLength)}`;
};

export default ((params) => (processor) => {
    const date = new Date();
    const major = params.major || "0";
    const minor = (date.getFullYear() * fourDigits) + ((date.getMonth() + 1) * twoDigits) + date.getDate();
    const build = (date.getHours() * fourDigits) + (date.getMinutes() * twoDigits) + date.getSeconds();
    const version = addPostfix(params.version || `${major}.${minor}.${build}`, params, processor);
    const nupkg = `${params.name}.${version}.nupkg`;

    return sequential({
        tasks: [
            {
                name: "pack",
                task: dotnetbuilderwrapper({
                    BaseDirectory: processor.context.exported,
                    OutputDirectory: processor.context.exported,
                    SpecPath: join(processor.context.exported, params.nuspec),
                    Version: version,
                    command: "nugetpack",
                }),
            },
            params.getFinalTask(nupkg),
        ],
    })(processor);
}) as GenericTask<IDotNetNuGetProcessInternalParameters>;
