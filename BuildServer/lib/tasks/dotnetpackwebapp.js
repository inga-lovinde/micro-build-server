"use strict";

var fs = require('fs'),
	Mustache = require('mustache');

var sequential = require('./sequential');

var msbuildTemplate = fs.readFileSync(__dirname + "/dotnetpackwebapp.template.msbuild", {encoding: "utf8"});
var deployTemplate = fs.readFileSync(__dirname + "/dotnetpackwebapp.template.bat", {encoding: "utf8"});

module.exports = function (params, processor) {

	return sequential({
		tasks: [
			{
				type: "writefile",
				params: {
					filename: "MakePackage.msbuild",
					data: Mustache.render(msbuildTemplate, params)
				}
			},
			{
				type: "writefile",
				params: {
					filename: "Deploy.bat",
					data: Mustache.render(deployTemplate, params)
				}
			},
			{
				type: "dotnetbuilderwrapper",
				params: {
					command: "compile",
					SolutionPath: processor.context.exported + "/" + "MakePackage.msbuild",
					Target: "Package",
					OutputDirectory: processor.context.release
				}
			}
		]
	}, processor);
};
