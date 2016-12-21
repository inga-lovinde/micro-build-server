"use strict";

const sequential = require('./sequential');

module.exports = (params, processor) => sequential({
	tasks: [
		{
			type: "eslintbrowserall",
			params: {
				excludeFiles: params.eslintExcludeFiles
			}
		},
		{
			type: "uglifyjsall"
		},
		{
			type: "cssnanoall"
		},
		{
			type: "writefile",
			params: {
				filename: "version.txt",
				data: processor.context.versionInfo
			}
		},
		{
			type: "zip",
			params: {
				directory: "",
				archive: processor.context.reponame + ".zip"
			}
		}
	]
}, processor);
