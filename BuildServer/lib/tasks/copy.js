"use strict";

var fs = require('fs');
var fse = require('fs-extra');
var async = require('async');
var glob = require('glob');

module.exports = function (params, processor) {
	return {
		process: function () {
			var sourceFilePath = processor.context.exported + "/" + params.filename,
				targetFilePath = processor.context.release + "/" + params.filename;

			processor.onInfo("Copying " + sourceFilePath + " to " + targetFilePath);

			fse.copy(sourceFilePath, targetFilePath, function(err) {
				if (err) {
					processor.onError("Unable to copy file: " + err);
				} else {
					processor.onInfo("Copied file");
				}
				return processor.done();
			});
		}
	};
};
