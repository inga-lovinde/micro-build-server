"use strict";

var fs = require('fs');
var async = require('async');
var glob = require('glob');

var autoGeneratedMarker = 
	"//------------------------------------------------------------------------------" + "\n" +
	"// <auto-generated>";

module.exports = function (params, processor) {
	return {
		process: function () {
			if (processor.context.dotnetcheckerDone) {
				return processor.done();
			}

			processor.context.dotnetcheckerDone = true;

			glob("**/*.cs", {cwd: processor.context.exported}, function (err, files) {
				if (err) {
					processor.onError(err);
					return processor.done();
				}

				processor.onInfo("Found " + files.length + " .cs files");

				if (!files || !files.length) {
					processor.onWarn("No AssemblyInfo.cs found");
					return processor.done();
				}

				return async.parallel(files.map(function (file) {
					return function (callback) {
						return fs.readFile(processor.context.exported + "/" + file, { encoding: "utf8" }, function (err, data) {
							if (err) {
								processor.onError("Unable to check file " + file + ": " + err);
							} else if (data.indexOf("\r\n") >= 0) {
								processor.onError("Windows-style EOL (0D0A) found in file " + file);
							} else if (data.substr(1, autoGeneratedMarker.length) === autoGeneratedMarker || data.substr(0, autoGeneratedMarker.length) === autoGeneratedMarker) {
								processor.onInfo("Skipping auto-generated file " + file);
							} else if (data.indexOf("\t") >= 0 && data.indexOf("    ") >= 0) {
								processor.onError("Both tabs and spaces found in file " + file);
							} else {
								processor.onInfo("Checked file " + file);
							}
							callback(err);
						});
					};
				}), processor.done.bind(processor));
			});
		}
	};
};