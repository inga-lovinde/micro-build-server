"use strict";

var conditional = require('./conditional');

module.exports = function (params, processor) {
	return conditional({
		"owner": params.masterRepoName,
		"branch": "master",
		"task": {
			"name": "nuget-push",
			"type": "dotnetnugetpush",
			"params": {
				"nuspec": params.nuspecName + ".nuspec",
				"name": params.nuspecName,
				"version": params.version
			}
		},
		"otherwise": {
			"name": "nuget-pack",
			"type": "dotnetnugetpack",
			"params": {
				"nuspec": params.nuspecName + ".nuspec",
				"version": params.version
			}
		}
	}, processor);
};
