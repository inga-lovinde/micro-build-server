"use strict";

var sequential = require("./sequential");
var settings = require("../../settings");

module.exports = function (params, processor) {
	return sequential({
		tasks: [
			{
				type: "dotnetbuild",
				name: "build",
				params: {
					solution: params.solution
				}
			},
			{
				type: "dotnetnunitall",
				name: "test"
			}
		]
	}, processor);
};
