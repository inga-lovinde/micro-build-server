"use strict";

const sequential = require('./sequential');

module.exports = (params, processor) => sequential({
	tasks: [
		{
			type: "zip",
			params: {
				directory: "",
				archive: processor.context.reponame + ".zip"
			}
		}
	]
}, processor);
