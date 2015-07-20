"use strict";

var sequential = require('./sequential');

module.exports = function (params, processor) {
	var date = new Date(),
		version = params.version || ((params.major || "0") + "." + date.getFullYear() + "." + ((date.getMonth() + 1) * 100 + date.getDate()) + "." + ((date.getHours() * 100 + date.getMinutes()) * 100 + date.getSeconds())),
		nupkg = processor.context.exported + "/" + params.name + "." + version + ".nupkg";

	return sequential({
		tasks: [
			{
				type: "dotnetbuilderwrapper",
				params: {
					command: "nugetpack",
					BaseDirectory: processor.context.exported,
					SpecPath: processor.context.exported + "/" + params.nuspec,
					OutputDirectory: processor.context.exported,
					Version: version
				}
			}
		]
	}, processor);
};
