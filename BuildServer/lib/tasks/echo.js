"use strict";

module.exports = (params, processor) => ({
	process: () => {
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
});
