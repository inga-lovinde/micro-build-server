"use strict";

const glob = require('glob');

module.exports = function (params, processor) {
	return {
		process: function () {
			glob(params.mask, {
				dot: true,
				cwd: processor.context.exported
			}, function (err, files) {
				if (err) {
					processor.onError(err);
					return processor.done();
				}

				if (!files || !files.length) {
					return processor.done();
				}

				return processor.processTask({
					type: "parallel",
					params: {
						tasks: files.map(function (file) {
							return {
								name: file,
								type: "copy",
								params: {
									filename: file
								}
							};
						})
					}
				}, processor.done.bind(processor));
			});
		}
	};
};
