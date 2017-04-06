"use strict";

import { join } from "path";

import { BuilderCompileRequest, GenericTask } from "../types";
import dotnetbuilderwrapper from "./dotnetbuilderwrapper";

interface IDotNetCompileParameters {
    readonly configuration: string;
    readonly overrideOutputDirectory?: string;
    readonly skipCodeAnalysis: boolean;
    readonly solution: string;
    readonly target: string;
    readonly forceCodeAnalysis?: boolean;
    readonly skipCodeSigning?: boolean;
    readonly ignoreCodeAnalysis?: boolean;
}

export default ((params) => (processor) => {
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

    const compileParams: BuilderCompileRequest = {
        Configuration: params.configuration,
        OutputDirectory: params.overrideOutputDirectory,
        SkipCodeAnalysis: skipCodeAnalysis,
        SolutionPath: join(processor.context.exported, params.solution),
        Target: params.target,
        command: "compile",
        ...getAdditionalSigningParameters(),
    };

    return dotnetbuilderwrapper(compileParams)(processor);
}) as GenericTask<IDotNetCompileParameters>;
