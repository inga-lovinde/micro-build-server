"use strict";

var conditional = require('./conditional');

module.exports = function (params, processor) {
	return conditional({
		"owner": params.masterRepoOwner,
		"branch": "master",
		"task": {
			"name": "nuget-push",
			"type": "dotnetnugetpush",
			"params": {
				"nuspec": params.nuspecName + ".nuspec",
				"name": params.nuspecName,
				"version": params.version,
				"major": params.major
			}
		},
		"otherwise": {
			"name": "nuget-pack",
			"type": "dotnetnugetpack",
			"params": {
				"nuspec": params.nuspecName + ".nuspec",
				"version": params.version,
				"major": params.major
			}
		}
	}, processor);
};
