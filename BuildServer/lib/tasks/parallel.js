"use strict";

const async = require("async");

module.exports = function (params, processor) {
	return {
		process: function () {
			async.parallel(params.tasks.map(function (task) {
				return function (callback) {
					return processor.processTask(task, function (err) {
						return callback();
					});
				};
			}), processor.done.bind(processor));
		}
	};
};
