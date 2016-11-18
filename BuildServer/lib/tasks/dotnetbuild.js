"use strict";

const sequential = require('./sequential');

module.exports = (params, processor) => sequential({
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
