"use strict";

var sequential = require('./sequential');

module.exports = function (params, processor) {
	return sequential({
		tasks: [
			{
				type: "dotnetrewrite",
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
