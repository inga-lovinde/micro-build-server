"use strict";

var dotnetbuilderwrapper = require('./dotnetbuilderwrapper');

module.exports = function (params, processor) {
	var compileParams = {
		command: "compile",
		SolutionPath: processor.context.exported + "/" + params.solution,
		Target: params.target,
		OutputDirectory: params.overrideOutputDirectory
	};
	return dotnetbuilderwrapper(compileParams, processor);
}
