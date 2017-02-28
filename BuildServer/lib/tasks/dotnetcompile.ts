"use strict";

import { join } from "path";
import * as _ from "underscore";
import settings from "../../settings";
import dotnetbuilderwrapper from "./dotnetbuilderwrapper";

export default ((params, processor) => {
    if (settings.isCodeAnalysisUnsupported && params.forceCodeAnalysis) {
        processor.onError("Code analysis is not supported");

        return processor.done();
    }

    const getAdditionalSigningParameters = () => {
        if (settings.skipCodeSigning || params.skipCodeSigning) {
            return {};
        }

        return { SigningKey: settings.codeSigningKeyFile };
    };

    const skipCodeAnalysis = settings.isCodeAnalysisUnsupported
        || params.ignoreCodeAnalysis
        || (settings.ignoreCodeAnalysisByDefault && !params.forceCodeAnalysis);

    const compileParams = {
        Configuration: params.configuration,
        OutputDirectory: params.overrideOutputDirectory,
        SkipCodeAnalysis: skipCodeAnalysis,
        SolutionPath: join(processor.context.exported, params.solution),
        Target: params.target,
        command: "compile",
    };

    return dotnetbuilderwrapper(_.extend(compileParams, getAdditionalSigningParameters()), processor);
}) as Task;
