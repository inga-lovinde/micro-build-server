"use strict";

var sequential = require('./sequential');

module.exports = function (params, processor) {
	var tasks = [];

	if (!params.skipMbsCheckStyle) {
		tasks.push({
			type: "dotnetcheckstyle",
			params: params
		});
	}

	tasks.push({
		type: "dotnetrewrite",
		params: params
	});

	tasks.push({
		type: "dotnetnugetrestore",
		params: params
	});

	tasks.push({
		type: "dotnetcompile",
		params: {
			solution: params.solution,
			skipCodeSigning: params.skipCodeSigning,
			forceCodeAnalysis: params.forceCodeAnalysis,
			ignoreCodeAnalysis: params.ignoreCodeAnalysis,
			configuration: params.configuration,
			target: "Build"
		}
	});

	return sequential({
		tasks: tasks
	}, processor);
};
