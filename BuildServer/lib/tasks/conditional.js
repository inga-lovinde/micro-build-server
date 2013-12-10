"use strict";

module.exports = function (params, processor) {
	var condition = (!params.owner || params.owner === processor.context.owner) && (!params.branch || params.branch === processor.context.branch || "refs/heads/" + params.branch === processor.context.branch),
		task = condition ? params.task : params.otherwise;

	return {
		process: function () {
			return processor.processTask(task || {type: "noop"}, processor.done.bind(processor));
		}
	};
};
