"use strict";

import { GenericTask, TaskInfo } from "../types";
import dotnetcheckstyle from "./dotnetcheckstyle";
import dotnetcompile from "./dotnetcompile";
import dotnetnugetrestore from "./dotnetnugetrestore";
import dotnetrewrite from "./dotnetrewrite";
import sequential from "./sequential";

interface IDotNetBuilderWithoutCleanupParameters {
    readonly skipMbsCheckStyle?: boolean;
    readonly forceCodeAnalysis?: boolean;
    readonly ignoreCodeAnalysis?: boolean;
    readonly skipCodeAnalysis: boolean;
    readonly skipCodeSigning?: boolean;
    readonly skipNugetRestore?: boolean;
    readonly configuration: string;
    readonly solution: string;
    readonly ignoreCodeStyle: boolean;
}

const createTasks = function *(params: IDotNetBuilderWithoutCleanupParameters) {
    if (!params.skipMbsCheckStyle) {
        yield {
            name: "dotnetcheckstyle",
            task: dotnetcheckstyle(params),
        } as TaskInfo;
    }

    yield {
        name: "dotnetrewrite",
        task: dotnetrewrite(params),
    } as TaskInfo;

    if (!params.skipNugetRestore) {
        yield {
            name: "dotnetnugetrestore",
            task: dotnetnugetrestore(params),
        } as TaskInfo;
    }

    yield {
        name: "dotnetcompile",
        task: dotnetcompile({
            ...params,
            target: "Rebuild",
        }),
    } as TaskInfo;
};

export default ((params) => (processor) => {
    const tasks = Array.from(createTasks(params)) as TaskInfo[];
    return sequential({ tasks })(processor);
}) as GenericTask<IDotNetBuilderWithoutCleanupParameters>;
