"use strict";

var sequential = require("./sequential");
var settings = require("../../settings");

module.exports = function (params, processor) {
	var date = new Date(),
		version = (params.version || ((params.major || "0") + "." + (date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()) + "." + ((date.getHours() * 100 + date.getMinutes()) * 100 + date.getSeconds()))) + "-r" + processor.context.rev.substr(0, 16),
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
			},
			{
				type: "dotnetnugetpushonly",
				params: {
					Package: nupkg
				}
			}
		]
	}, processor);
};
