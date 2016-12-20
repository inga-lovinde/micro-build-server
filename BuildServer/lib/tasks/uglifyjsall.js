"use strict";

const glob = require('glob');

module.exports = (params, processor) => ({
	process: () => {
		if (processor.context.uglifyjsallDone) {
			processor.onWarn("dotnetnunitall task is executed more than once; this is probably a bug in your mbs.json");
		}

		processor.context.uglifyjsallDone = true;

		glob("**/*.js", {
			dot: true,
			cwd: processor.context.exported
		}, (err, files) => {
			if (err) {
				processor.onError(err);
				return processor.done();
			}

			return processor.processTask({
				type: params.preventParallelTests ? "sequential" : "parallel",
				params: {
					tasks: files.map((file) => ({
						name: file,
						type: "uglifyjs",
						params: {
							filename: file
						}
					}))
				}
			}, processor.done.bind(processor));
		});
	}
});
