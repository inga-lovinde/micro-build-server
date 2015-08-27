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
	return dotnetbuilderwrapper(compileParams, processor);
}
