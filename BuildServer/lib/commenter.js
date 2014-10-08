"use strict";

var fs = require('fs'),
	builder = require('../lib/builder'),
	settings = require('../settings');

var getStatusMessageFromRelease = function (app, options, callback) {
	var releaseDir = app.get('releasepath') + "/" + options.owner + "/" + options.reponame + "/" + options.branch + "/" + options.rev,
		reportFile = releaseDir + "/report.json";

	fs.exists(reportFile, function (exists) {
		if (!exists) {
			fs.exists(releaseDir, function (dirExists) {
				if (!dirExists) {
					return callback("Release directory not found. Probably repository hooks are not configured");
				}
				if (options.lastAttempt) {
					return callback("Report file not found");
				}

				//maybe it is building right now
				options.lastAttempt = true;
				setTimeout(function () {
					getStatusMessageFromRelease(app, options, callback);
				}, 10000);
			});
		}

		fs.readFile(reportFile, function (err, dataBuffer) {
			if (err) {
				return callback(err);
			}
			var data = dataBuffer.toString();
			if (!data) {
				return callback("Report file not found");
			}
			var report = JSON.parse(data);

			if (report.result === "MBSNotFound") {
				return callback("mbs.json is not found");
			}
			if (report.err) {
				return callback("ERR: " + report.err);
			}
			if ((report.result.warns.$allMessages || []).length > 0) {
				return callback("WARN: " + report.result.warns.$allMessages[0].message);
			}
			if ((report.result.infos.$allMessages || []).length > 0) {
				return callback(undefined, report.result.infos.$allMessages[report.result.infos.$allMessages.length-1].message);
			}
			return callback(undefined, "OK");
		});
	});
};

exports.commentOnPullRequest = function (options, callback) {
	getStatusMessageFromRelease(options.app, options.headRepoOptions, function (err, successMessage) {
		var message = err ? ("Was not built:\r\n\r\n" + err + "\r\n\r\nDO NOT MERGE!") : ("Build OK\r\n\r\n" + successMessage);
		settings.createGithub(options.baseRepoOptions.owner).issues.createComment({
			user: options.baseRepoOptions.owner,
			repo: options.baseRepoOptions.reponame,
			number: options.number,
			body: message
		}, callback);
	});
};
