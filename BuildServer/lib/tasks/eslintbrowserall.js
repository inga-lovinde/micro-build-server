"use strict";

const glob = require('glob');

module.exports = (params, processor) => ({
	process: () => {
		if (processor.context.eslintbrowserallDone) {
			processor.onWarn("eslintbrowserall task is executed more than once; this is probably a bug in your mbs.json");
		}

		processor.context.eslintbrowserallDone = true;

		const excludeFiles = params.excludeFiles || [];

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
					tasks: files.filter(file => !excludeFiles.includes(file)).map((file) => ({
						name: file,
						type: "eslintbrowser",
						params: {
							filename: file
						}
					}))
				}
			}, processor.done.bind(processor));
		});
	}
});
