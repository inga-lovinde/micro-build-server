"use strict";

const glob = require('glob');

module.exports = (params, processor) => ({
	process: () => {
		if (processor.context.dotnetnunitallDone) {
			processor.onWarn("dotnetnunitall task is executed more than once; this is probably a bug in your mbs.json");
		}

		processor.context.dotnetnunitallDone = true;

		glob("**/{bin,build}/**/*.{Tests,Test,UnitTests}.dll", {
			dot: true,
			cwd: processor.context.exported
		}, (err, files) => {
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
					tasks: files.map((file) => ({
						name: file,
						type: "dotnetnunit",
						params: {
							assembly: file
						}
					}))
				}
			}, processor.done.bind(processor));
		});
	}
});
