"use strict";

var sequential = require('./sequential');

module.exports = function (params, processor) {
	return sequential({
		tasks: [
			{
				type: "dotnetcheckstyle"
			},
			{
				type: "dotnetrewrite",
				params: {
					skipCodeSigning: params.skipCodeSigning
				}
			},
			{
				type: "dotnetbuilderwrapper",
				params: {
					command: "compile",
					SolutionPath: processor.context.exported + "/" + params.solution,
					Target: "Build"
				}
			}
		]
	}, processor);
};
