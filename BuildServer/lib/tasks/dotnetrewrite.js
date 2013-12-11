"use strict";

var fs = require('fs');
var async = require('async');
var glob = require('glob');

module.exports = function (params, processor) {
	return {
		process: function () {
			if (processor.context.dotnetrewriterDone) {
				return processor.done();
			}

			processor.context.dotnetrewriterDone = true;

			var date = new Date(),
				version = date.getFullYear() + "." +
					(date.getMonth() + 1) + "." +
					date.getDay() + "." +
					((date.getHours() * 100 + date.getMinutes()) * 100 + date.getSeconds()) + " (" +
					"built from " + processor.context.rev + "; " +
					"repository: " + processor.context.owner + "/" + processor.context.reponame + "; " +
					"branch: " + processor.context.branch + ")";

			var textToAppend = "\r\n[assembly: AssemblyInformationalVersion(\"" + version + "\")]\r\n"

			glob("**/AssemblyInfo.cs", {cwd: processor.context.exported}, function (err, files) {
				if (err) {
					processor.onError(err);
					return processor.done();
				}

				processor.onInfo("Found " + files.length + " AssemblyInfo.cs files");

				if (!files || !files.length) {
					processor.onWarn("No AssemblyInfo.cs found");
					return processor.done();
				}

				return async.parallel(files.map(function (file) {
					return function (callback) {
						return fs.appendFile(processor.context.exported + "/" + file, textToAppend, function (err, result) {
							if (err) {
								processor.onError("Unable to rewrite file " + file + ": " + err);
							} else {
								processor.onInfo("Rewritten file " + file);
							}
							callback(err, result);
						});
					}
				}), processor.done.bind(processor));
			})
		}
	};
};
