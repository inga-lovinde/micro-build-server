"use strict";

var async = require("async");

var series = function (tasks, callback) {
	console.log("arguments:");
	console.log(arguments);
	console.log("first task:");
	console.log(tasks[0]);
	tasks[0]("xxx");
	console.log("executed tasks[0]");
	async.series(tasks, callback);
}

module.exports = function (params, processor) {
	var mapper = Function.bind.bind(processor.processTask, processor);
	return {
		process: function () {
			async.series(params.tasks.map(function (element) { return mapper(element); }), processor.done.bind(processor));
		}
	};
};
