"use strict";

const async = require("async");

module.exports = (params, processor) => {
	const mapper = Function.bind.bind(processor.processTask, processor);
	return {
		process: () => async.series(params.tasks.map((element) => mapper(element)), processor.done.bind(processor))
	};
};
