"use strict";

import { GenericTask } from "../types";
import cleanupafterdotnetbuild from "./cleanupafterdotnetbuild";
import dotnetbuildwithoutcleanup from "./dotnetbuildwithoutcleanup";
import dotnetnunitall from "./dotnetnunitall";
import sequential from "./sequential";

interface IDotNetBuildAndTestParameters {
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

export default ((params) => (processor) => sequential({
    tasks: [
        {
            name: "build",
            task: dotnetbuildwithoutcleanup(params),
        },
        {
            name: "test",
            task: dotnetnunitall(params),
        },
        {
            name: "cleanup",
            task: cleanupafterdotnetbuild({}),
        },
    ],
})(processor)) as GenericTask<IDotNetBuildAndTestParameters>;
