"use strict";

var sequential = require('./sequential');

module.exports = function (params, processor) {
	return sequential({
		tasks: [
			{
				type: "dotnetcheckstyle",
				params: params
			},
			{
				type: "dotnetrewrite",
				params: params
			},
			{
				type: "dotnetnugetrestore",
				params: params
			},
			{
				type: "dotnetcompile",
				params: {
					solution: params.solution,
					skipCodeSigning: params.skipCodeSigning,
					forceCodeAnalysis: params.forceCodeAnalysis,
					ignoreCodeAnalysis: params.ignoreCodeAnalysis,
					target: "Build"
				}
			}
		]
	}, processor);
};
