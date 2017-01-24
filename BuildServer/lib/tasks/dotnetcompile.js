"use strict";

const path = require("path");
const settings = require("../../settings");
const dotnetbuilderwrapper = require("./dotnetbuilderwrapper");

module.exports = (params, processor) => {
    const compileParams = {
        "Configuration": params.configuration,
        "OutputDirectory": params.overrideOutputDirectory,
        "SolutionPath": path.join(processor.context.exported, params.solution),
        "Target": params.target,
        "command": "compile"
    };

    if (!settings.skipCodeSigning && !params.skipCodeSigning) {
        compileParams.SigningKey = settings.codeSigningKeyFile;
    }

    if (settings.isCodeAnalysisUnsupported && params.forceCodeAnalysis) {
        processor.onError("Code analysis is not supported");

        return processor.done();
    }

    if (
        settings.isCodeAnalysisUnsupported
        || params.ignoreCodeAnalysis
        || (settings.ignoreCodeAnalysisByDefault && !params.forceCodeAnalysis)
    ) {
        compileParams.SkipCodeAnalysis = true;
    }

    return dotnetbuilderwrapper(compileParams, processor);
};
