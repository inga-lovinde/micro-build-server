"use strict";

const dotnetbuilderwrapper = require('./dotnetbuilderwrapper');
const settings = require("../../settings");

module.exports = (params, processor) => dotnetbuilderwrapper({
	command: "nugetpush",
	Package: processor.context.exported + "/" + params.Package,
	NugetHost: settings.nugetHost,
	ApiKey: settings.nugetApiKey
}, processor);
