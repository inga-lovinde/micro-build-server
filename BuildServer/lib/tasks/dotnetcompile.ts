"use strict";

import { join } from "path";

import { Task } from "../types";
import dotnetbuilderwrapper from "./dotnetbuilderwrapper";

export default ((params, processor) => {
    if (processor.settings.isCodeAnalysisUnsupported && params.forceCodeAnalysis) {
        processor.onError("Code analysis is not supported");

        return processor.done();
    }

    const getAdditionalSigningParameters = () => {
        if (processor.settings.skipCodeSigning || params.skipCodeSigning) {
            return {};
        }

        return { SigningKey: processor.settings.codeSigningKeyFile };
    };

    const skipCodeAnalysis = processor.settings.isCodeAnalysisUnsupported
        || params.ignoreCodeAnalysis
        || (processor.settings.ignoreCodeAnalysisByDefault && !params.forceCodeAnalysis);

    const compileParams = {
        Configuration: params.configuration,
        OutputDirectory: params.overrideOutputDirectory,
        SkipCodeAnalysis: skipCodeAnalysis,
        SolutionPath: join(processor.context.exported, params.solution),
        Target: params.target,
        command: "compile",
    };

    return dotnetbuilderwrapper({
        ...compileParams,
        ...getAdditionalSigningParameters(),
    }, processor);
}) as Task;
