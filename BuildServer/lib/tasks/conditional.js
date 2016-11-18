"use strict";

module.exports = (params, processor) => {
	const condition = (!params.owner || params.owner === processor.context.owner) && (!params.branch || params.branch === processor.context.branch || "refs/heads/" + params.branch === processor.context.branch);
	const task = condition ? params.task : params.otherwise;

	return {
		process: () => processor.processTask(task || {type: "noop"}, processor.done.bind(processor))
	};
};
