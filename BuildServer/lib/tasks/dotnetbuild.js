"use strict";

var sequential = require('./sequential');

module.exports = function (params, processor) {
	return sequential({
		tasks: [
			{
				type: "dotnetbuildwithoutcleanup",
				name: "build",
				params: params
			},
			{
				type: "cleanupafterdotnetbuild",
				name: "cleanup"
			}
		]
	}, processor);
};
