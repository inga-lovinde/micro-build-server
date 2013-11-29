"use strict";

var dotNetBuilderWrapper = require('./dotnetbuilderwrapper');

module.exports = function (params, processor) {
	return dotNetBuilderWrapper({
		"SolutionPath": processor.context.exported + "/" + params.solution,
		"OutputPath": processor.context.release + "/" + params.solution + "/"
	}, processor);
};
