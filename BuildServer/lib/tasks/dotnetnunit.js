"use strict";

const dotNetBuilderWrapper = require('./dotnetbuilderwrapper');

module.exports = (params, processor) => dotNetBuilderWrapper({
	command: "nunit",
	TestLibraryPath: processor.context.exported + "/" + params.assembly//,
//	OutputPath: processor.context.release + "/" + params.solution + "/"
}, processor);
