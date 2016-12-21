"use strict";

const fs = require('fs');
const path = require('path');
const cssnano = require("cssnano");

module.exports = (params, processor) => ({
	process: () => {
		const filePath = path.normalize(processor.context.exported + "/" + params.filename);
		fs.readFile(filePath, (err, css) => {
			if (err) {
				processor.onError("Unable to read stylesheet " + params.filename + ": " + err);
				return processor.done();
			}

			cssnano.process(css)
				.catch((err) => {
					processor.onError("Unable to uglify stylesheet: " + err);
					processor.done();
				})
				.then((result) => {
					fs.writeFile(filePath, result.css, (err) => {
						if (err) {
							processor.onError("Unable to write uglified stylesheet for " + params.filename + ": " + err);
						} else {
							processor.onInfo("Saved uglified stylesheet for " + params.filename + "; uglified length: " + result.css.length);
						}

						processor.done();
					});
				});
                });
	}
});

