"use strict";

var dotNetBuilderWrapper = require('./dotnetbuilderwrapper');

module.exports = function (params, processor) {
	return dotNetBuilderWrapper({
		command: "nunit",
		TestLibraryPath: processor.context.exported + "/" + params.assembly//,
//		OutputPath: processor.context.release + "/" + params.solution + "/"
	}, processor);
};
