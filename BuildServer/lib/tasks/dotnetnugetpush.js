"use strict";

var sequential = require("./sequential");
var settings = require("../../settings");

module.exports = function (params, processor) {
	var date = new Date(),
		version = (params.major || "0") + "." + date.getFullYear() + "." + ((date.getMonth() + 1) * 100 + date.getDay()) + "." + ((date.getHours() * 100 + date.getMinutes()) * 100 + date.getSeconds());

	return sequential({
		tasks: [
			{
				type: "dotnetbuilderwrapper",
				params: {
					command: "nugetpack",
					BaseDirectory: processor.context.exported,
					SpecPath: processor.context.exported + "/" + params.nuspec,
					OutputDirectory: processor.context.release,
					Version: version
				}
			},
			{
				type: "dotnetbuilderwrapper",
				params: {
					command: "nugetpush",
					Package: processor.context.release + "/" + params.name + "." + version + ".nupkg",
					NugetHost: settings.nugetHost,
					ApiKey: settings.nugetApiKey
				}
			}
		]
	}, processor);
};
