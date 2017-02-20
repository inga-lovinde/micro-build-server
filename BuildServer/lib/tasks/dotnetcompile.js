"use strict";

const path = require("path");
const _ = require("underscore");
const settings = require("../../settings");
const dotnetbuilderwrapper = require("./dotnetbuilderwrapper");

module.exports = (params, processor) => {
    if (settings.isCodeAnalysisUnsupported && params.forceCodeAnalysis) {
        processor.onError("Code analysis is not supported");

        return processor.done();
    }

    const getAdditionalSigningParameters = () => {
        if (settings.skipCodeSigning || params.skipCodeSigning) {
            return {};
        }

        return { "SigningKey": settings.codeSigningKeyFile };
    };

    const skipCodeAnalysis = settings.isCodeAnalysisUnsupported
        || params.ignoreCodeAnalysis
        || (settings.ignoreCodeAnalysisByDefault && !params.forceCodeAnalysis);

    const compileParams = {
        "Configuration": params.configuration,
        "OutputDirectory": params.overrideOutputDirectory,
        "SkipCodeAnalysis": skipCodeAnalysis,
        "SolutionPath": path.join(processor.context.exported, params.solution),
        "Target": params.target,
        "command": "compile"
    };

    return dotnetbuilderwrapper(_.extend(compileParams, getAdditionalSigningParameters()), processor);
};
