"use strict";

module.exports = function (params, processor) {
	return {
		process: function () {
			if (params.error) {
				processor.onError(params.error);
			}

			if (params.warn) {
				processor.onWarn(params.warn);
			}

			if (params.info) {
				processor.onInfo(params.info);
			}

			processor.done();
		}
	};
};
