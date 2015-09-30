"use strict";

var settings = require('../../settings');
var dotnetbuilderwrapper = require('./dotnetbuilderwrapper');

module.exports = function (params, processor) {
	var compileParams = {
		command: "compile",
		SolutionPath: processor.context.exported + "/" + params.solution,
		Target: params.target,
		OutputDirectory: params.overrideOutputDirectory
	};
	if (!settings.skipCodeSigning && !params.skipCodeSigning) {
		compileParams.SigningKey = settings.codeSigningKeyFile;
	}
	if (!settings.isCodeAnalysisUnsupported && !params.ignoreCodeAnalysis) {
		compileParams.CodeAnalysisRuleSet = settings.codeAnalysisRuleSet;
	}
	return dotnetbuilderwrapper(compileParams, processor);
}
