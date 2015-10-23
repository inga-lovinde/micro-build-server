"use strict";

var glob = require('glob');
var dotNetBuilderWrapper = require('./dotnetbuilderwrapper');

module.exports = function (params, processor) {
	return {
		process: function () {
			if (processor.context.dotnetnunitallDone) {
				processor.onWarn("dotnetnunitall task is executed more than once; this is probably a bug in your mbs.json");
			}

			processor.context.dotnetnunitallDone = true;

			glob("**/{bin,build}/**/*.{Tests,Test,UnitTests}.dll", {
				dot: true,
				cwd: processor.context.exported
			}, function (err, files) {
				if (err) {
					processor.onError(err);
					return processor.done();
				}

				if (!files || !files.length) {
					processor.onError("No test assemblies found in " + processor.context.exported);
					return processor.done();
				}

				return processor.processTask({
					type: params.preventParallelTests ? "sequential" : "parallel",
					params: {
						tasks: files.map(function (file) {
							return {
								name: file,
								type: "dotnetnunit",
								params: {
									assembly: file
								}
							};
						})
					}
				}, processor.done.bind(processor));
			})
		}
	};
};
