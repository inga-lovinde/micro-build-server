"use strict";

var dotNetBuilderWrapper = require('./dotnetbuilderwrapper');

module.exports = function (params, processor) {
	return dotNetBuilderWrapper({
		command: "compile",
		SolutionPath: processor.context.exported + "/" + params.solution//,
//		OutputPath: processor.context.release + "/" + params.solution + "/"
	}, processor);
};
