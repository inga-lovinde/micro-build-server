"use strict";

const fs = require('fs');
const path = require('path');
const Zip = require('adm-zip');

module.exports = (params, processor) => ({
	process: () => {
		const sourceDirectoryPath = path.normalize(processor.context.exported + "/" + (params.directory || ""));
		const targetArchivePath = path.normalize(processor.context.release + "/" + params.archive);
		const zip = new Zip();

		processor.onInfo("Compressing '" + params.directory + "' to " + params.archive);

		zip.addLocalFolder(sourceDirectoryPath);
		zip.toBuffer((buffer) => {
			fs.writeFile(targetArchivePath, buffer, (err) => {
				if (err) {
					processor.onError("Unable to write compressed data: " + err);
				} else {
					processor.onInfo("Compressed");
				}

				processor.done();
			});
		}, (error) => {
			processor.onError("Unable to compress: " + error);
			processor.done();
		}, () => { }, () => { });
	}
});
