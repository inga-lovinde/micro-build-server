"use strict";

const async = require("async");

module.exports = function (params, processor) {
	const mapper = Function.bind.bind(processor.processTask, processor);
	return {
		process: function () {
			async.series(params.tasks.map(function (element) { return mapper(element); }), processor.done.bind(processor));
		}
	};
};
