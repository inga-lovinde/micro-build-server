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
	if (!params.skipCodeSigning && !settings.skipCodeSigning) {
		compileParams.SigningKey = settings.codeSigningKeyFile;
	}
	if (!params.ignoreCodeAnalysis && !settings.ignoreCodeAnalysis) {
		compileParams.CodeAnalysisRuleSet = settings.codeAnalysisRuleSet;
	}
	return dotnetbuilderwrapper(compileParams, processor);
}
