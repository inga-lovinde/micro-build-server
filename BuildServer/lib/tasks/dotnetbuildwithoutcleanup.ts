"use strict";

import { GenericTask } from "../types";
import sequential from "./sequential";

interface IParameters {
    readonly skipMbsCheckStyle?: boolean;
    readonly forceCodeAnalysis?: boolean;
    readonly ignoreCodeAnalysis?: boolean;
    readonly skipCodeSigning?: boolean;
    readonly skipNugetRestore?: boolean;
    readonly configuration: string;
    readonly solution: string;
}

const createTasks = function *(params: IParameters) {
    if (!params.skipMbsCheckStyle) {
        yield {
            params,
            type: "dotnetcheckstyle",
        };
    }

    yield {
        params,
        type: "dotnetrewrite",
    };

    if (!params.skipNugetRestore) {
        yield {
            params,
            type: "dotnetnugetrestore",
        };
    }

    yield {
        params: {
            configuration: params.configuration,
            forceCodeAnalysis: params.forceCodeAnalysis,
            ignoreCodeAnalysis: params.ignoreCodeAnalysis,
            skipCodeSigning: params.skipCodeSigning,
            solution: params.solution,
            target: "Rebuild",
        },
        type: "dotnetcompile",
    };
};

export default ((params, processor) => {
    const tasks = Array.from(createTasks(params));

    return sequential({ tasks }, processor);
}) as GenericTask<IParameters>;
