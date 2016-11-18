"use strict";

module.exports = (params, processor) => ({
	process: () => processor.done()
});
