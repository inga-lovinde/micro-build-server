"use strict";

const settings = require('../../settings');
const dotnetbuilderwrapper = require('./dotnetbuilderwrapper');

module.exports = (params, processor) => {
	const compileParams = {
		command: "compile",
		SolutionPath: processor.context.exported + "/" + params.solution,
		Configuration: params.configuration,
		Target: params.target,
		OutputDirectory: params.overrideOutputDirectory
	};
	if (!settings.skipCodeSigning && !params.skipCodeSigning) {
		compileParams.SigningKey = settings.codeSigningKeyFile;
	}
	if (settings.isCodeAnalysisUnsupported) {
		if (params.forceCodeAnalysis) {
			processor.onError("Code analysis is not supported");
			processor.done();
			return;
		}
		compileParams.SkipCodeAnalysis = true;
	} else {
		if (settings.ignoreCodeAnalysisByDefault && !params.forceCodeAnalysis) {
			compileParams.SkipCodeAnalysis = true;
		}
		if (params.ignoreCodeAnalysis) {
			compileParams.SkipCodeAnalysis = true;
		}
	}
	return dotnetbuilderwrapper(compileParams, processor);
};
