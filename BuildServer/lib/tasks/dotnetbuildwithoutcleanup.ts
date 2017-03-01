"use strict";

import { Task } from "../../types";
import sequential from "./sequential";

const createTasks = function *(params) {
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
}) as Task;
