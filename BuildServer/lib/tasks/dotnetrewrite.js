"use strict";

var fs = require('fs');
var async = require('async');
var glob = require('glob');
var settings = require('../../settings');

var addAssemblyAttribute = function (content, attribute) {
	return content + "\n" + attribute + "\n";
}

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
					date.getDate() + "." +
					((date.getHours() * 100 + date.getMinutes()) * 100 + date.getSeconds()) + " (" +
					"built from " + processor.context.rev + "; " +
					"repository: " + processor.context.owner + "/" + processor.context.reponame + "; " +
					"branch: " + processor.context.branch + ")",
				processAssemblyInfo = function (content, cb) {
					if (!params.skipCodeSigning && !settings.skipCodeSigning) {
						content = content.replace(
							/InternalsVisibleTo\s*\(\s*\"([\w.]+)\"\s*\)/g,
							function (match, p1) {
								return "InternalsVisibleTo(\"" + p1 + ",PublicKey=" + settings.codeSigningPublicKey + "\")";
							}
						);
					}
					content = addAssemblyAttribute(content, "[assembly: AssemblyInformationalVersion(\"v" + version + "\")]");
					return cb(null, content);
				};

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
						return async.waterfall([
							fs.readFile.bind(null, processor.context.exported + "/" + file, { encoding: "utf8" }),
							processAssemblyInfo,
							fs.writeFile.bind(null, processor.context.exported + "/" + file)
						], function (err) {
							if (err) {
								processor.onError("Unable to rewrite file " + file + ": " + err);
							} else {
								processor.onInfo("Rewritten file " + file);
							}
							callback(err);
						});
					}
				}), processor.done.bind(processor));
			})
		}
	};
};
