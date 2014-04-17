"use strict";

var dotNetBuilderWrapper = require('./dotnetbuilderwrapper');

module.exports = function (params, processor) {
	var date = new Date();
	return dotNetBuilderWrapper({
		command: "nugetpack",
		BaseDirectory: processor.context.exported,
		SpecPath: processor.context.exported + "/" + params.nuspec,
		OutputDirectory: processor.context.release,
		Version: (params.major || "0") + "." + date.getFullYear() + "." + ((date.getMonth() + 1) * 100 + date.getDate()) + "." + ((date.getHours() * 100 + date.getMinutes()) * 100 + date.getSeconds())
	}, processor);
};
