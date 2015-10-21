"use strict";

var sequential = require("./sequential");
var dotnetbuilderwrapper = require('dotnetbuilderwrapper');
var settings = require("../../settings");

module.exports = function (params, processor) {
	return dotnetbuilderwrapper({
		command: "nugetpush",
		Package: params.Package,
		NugetHost: settings.nugetHost,
		ApiKey: settings.nugetApiKey
	}, processor);
};