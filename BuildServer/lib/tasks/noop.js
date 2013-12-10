"use strict";

module.exports = function (params, processor) {
	return {
		process: function () {
			processor.done();
		}
	};
};
