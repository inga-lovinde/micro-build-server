"use strict";

const sequential = require("./sequential");

module.exports = function (params, processor) {
	return sequential({
		tasks: [
			{
				type: "dotnetbuildwithoutcleanup",
				name: "build",
				params: params
			},
			{
				type: "dotnetnunitall",
				name: "test",
				params: params
			},
			{
				type: "cleanupafterdotnetbuild",
				name: "cleanup"
			}
		]
	}, processor);
};
