"use strict";

module.exports = function (params, processor) {
	return {
		process: function () {
			if (params.owner && params.owner != processor.context.owner) {
				return processor.done();
			}

			if (params.branch && params.branch != processor.context.branch) {
				return processor.done();
			}

			processor.processTask(params.task, function () {
				processor.done();
			});
		}
	};
};
