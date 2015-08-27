"use strict";

var fs = require('fs'),
	Mustache = require('mustache');

var sequential = require('./sequential');

var msbuildTemplate = fs.readFileSync(__dirname + "/dotnetpackwebapp.template.msbuild", {encoding: "utf8"});
var deployTemplate = fs.readFileSync(__dirname + "/dotnetpackwebapp.template.bat", {encoding: "utf8"});
var versionTemplate = fs.readFileSync(__dirname + "/dotnetpackwebapp.template.version.aspx", {encoding: "utf8"});

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
				type: "writefile",
				params: {
					filename: "version.aspx",
					data: Mustache.render(versionTemplate, params)
				}
			},
			{
				type: "dotnetcompile",
				params: {
					solution: "MakePackage.msbuild",
					skipCodeSigning: params.skipCodeSigning,
					target: "Package",
					overrideOutputDirectory: processor.context.release
				}
			}
		]
	}, processor);
};
