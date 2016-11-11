"use strict";

const fs = require('fs');

module.exports = function (params, processor) {
	return {
		process: function () {
			const filePath = processor.context.exported + "/" + params.filename;
			processor.onInfo("Writing to " + filePath);

			fs.writeFile(filePath, params.data, function(err) {
				if (err) {
					processor.onError("Unable to write file: " + err);
				} else {
					processor.onInfo("Written file");
				}
				return processor.done();
			});
		}
	};
};
