"use strict";

var sequential = require('./sequential');

module.exports = function (params, processor) {
	return sequential({
		tasks: [
			{
				type: "dotnetbuilderwrapper",
				params: {
					command: "nugetrestore",
					BaseDirectory: processor.context.exported,
					SolutionPath: processor.context.exported + "/" + params.solution
				}
			}
		]
	}, processor);
};
