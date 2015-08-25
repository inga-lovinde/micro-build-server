"use strict";

var fs = require('fs'),
	_ = require('underscore'),
	builder = require('../lib/builder'),
	settings = require('../settings');

var featureNamePattern = /^feature-(\d+)(?:-[a-zA-Z0-9]+)+$/;
var versionNamePattern = /^v\d+(\.\d+)*$/;
var masterNamePattern = /^master$/;

var writeComment = function (options, message, callback) {
	return options.github.issues.createComment({
		user: options.baseRepoOptions.owner,
		repo: options.baseRepoOptions.reponame,
		number: options.number,
		body: message
	}, callback);
};

var closePullRequest = function (options, message, callback) {
	return writeComment(options, message, function (err) {
		if (err) {
			return callback(err);
		}

		return options.github.issues.edit({
			user: options.baseRepoOptions.owner,
			repo: options.baseRepoOptions.reponame,
			number: options.number,
			state: "closed"
		}, callback);
	});
};

var checkHasIssue = function (options, issueNumber, callback) {
	return options.github.issues.getRepoIssue({
		user: options.baseRepoOptions.owner,
		repo: options.baseRepoOptions.reponame,
		number: issueNumber
	}, function (err, result) {
		if (err && err.code !== 404) {
			return callback(err);
		}

		if (err || result.number.toString() !== issueNumber) {
			return callback(undefined, false);
		}

		if (result.pull_request && result.pull_request.url) {
			return callback(undefined, false);
		}

		return callback(undefined, true, result.title);
	});
};

var checkHasReleases = function (options, callback) {
	return options.github.releases.listReleases({
		owner: options.baseRepoOptions.owner,
		repo: options.baseRepoOptions.reponame,
		per_page: 1
	}, function (err, result) {
		if (err) {
			return callback(err);
		}

		return callback(undefined, result && result.length);
	});
};

var checkPullRequest = function (options, callback) {
	var head = options.headRepoOptions,
		base = options.baseRepoOptions;

	if (head.reponame !== base.reponame) {
		return closePullRequest(options, "Base and head repository names should match", callback);
	}

	if (head.owner === base.owner) {
		if (!versionNamePattern.test(head.branchname) || !masterNamePattern.test(base.branchname)) {
			return closePullRequest(options, "Only merging from version to master is allowed", callback);
		}

		return checkHasReleases(options, function (err, hasReleases) {
			if (err) {
				return writeComment(options, "Unable to check for releases", callback);
			}

			if (!hasReleases) {
				return closePullRequest(options, "Merging from version to master is only allowed for repositories with releases", callback);
			}

			if (options.action === "opened") {
				return writeComment(options, "Switching master branch to " + head.branchname + " release", callback);
			}

			return process.nextTick(callback);
		});
	}

	if (!featureNamePattern.test(head.branchname)) {
		return closePullRequest(options, "Only merging from feature branch is allowed (pattern: `" + featureNamePattern.toString() + "`)", callback);
	}

	if (!versionNamePattern.test(base.branchname) && !masterNamePattern.test(base.branchname)) {
		return closePullRequest(options, "Only merging to master or version branch is allowed; merging to '" + base.branchname + "'  is not supported", callback);
	}

	var issueNumber = featureNamePattern.exec(head.branchname)[1];
	return checkHasIssue(options, issueNumber, function (err, hasIssue, issueTitle) {
		if (err) {
			return writeComment(options, "Unable to check for issue:\r\n\r\n" + err.message, callback);
		}

		if (!hasIssue) {
			return closePullRequest(options, "Unable to find issue #" + issueNumber, callback);
		}

		var shouldHaveReleases = versionNamePattern.test(base.branchname);
		return checkHasReleases(options, function (err, hasReleases) {
			if (err) {
				return writeComment(options, "Unable to check for releases", callback);
			}

			if (shouldHaveReleases && !hasReleases) {
				return closePullRequest(options, "Merging from feature to version is only allowed for repositories with releases", callback);
			}

			if (!shouldHaveReleases && hasReleases) {
				return closePullRequest(options, "Merging from feature to master is only allowed for repositories without releases", callback);
			}

			if (options.action === "opened") {
				return writeComment(options, "Merging feature #" + issueNumber + " (" + issueTitle + ") to " + base.branchname + (shouldHaveReleases ? " release" : ""), callback);
			}

			return process.nextTick(callback);
		});
	});
};

var getStatusMessageFromRelease = function (app, options, callback) {
	var releaseDir = app.get('releasepath') + "/" + options.owner + "/" + options.reponame + "/" + options.branch + "/" + options.rev,
		reportFile = releaseDir + "/report.json";

	options.attemptsGetReport = (options.attemptsGetReport || 0) + 1;

	fs.exists(reportFile, function (exists) {
		if (!exists) {
			return fs.exists(releaseDir, function (dirExists) {
				if (!dirExists) {
					return callback("Release directory not found. Probably repository hooks are not configured");
				}
				if (options.attemptsGetReport > 10) {
					return callback("Report file not found");
				}

				//maybe it is building right now
				return setTimeout(function () {
					getStatusMessageFromRelease(app, options, callback);
				}, 10000);
			});
		}

		return setTimeout(function () {
			return fs.readFile(reportFile, function (err, dataBuffer) {
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
				if ((report.result.errors.$allMessages || []).length + (report.result.warns.$allMessages || []).length > 0) {
					return callback(_.map(
						report.result.errors.$allMessages || [], function(message) { return "ERR: " + message.message }
					).concat(_.map(
						report.result.warns.$allMessages || [], function(message) { return "WARN: " + message.message }
					)).join("\r\n"));
				}
				if (report.err) {
					return callback("CRITICAL ERROR: " + report.err);
				}
				if ((report.result.infos.$allMessages || []).length > 0) {
					return callback(undefined, report.result.infos.$allMessages[report.result.infos.$allMessages.length-1].message);
				}
				return callback(undefined, "OK");
			});
		}, 1000);
	});
};

exports.commentOnPullRequest = function (options, callback) {
	options.github = settings.createGithub(options.baseRepoOptions.owner);
	return checkPullRequest(options, function (err, successMessage) {
		getStatusMessageFromRelease(options.app, options.headRepoOptions, function (err, successMessage) {
			var message = err ? ("Was not built:\r\n\r\n```\r\n" + err.replace(/```/g, '` ` `') + "\r\n```\r\n\r\nDO NOT MERGE!") : ("Build OK\r\n\r\n" + successMessage),
				statusUrlMessage = "Build status URL: " + settings.siteRoot + "status/" + options.headRepoOptions.owner + "/" + options.headRepoOptions.reponame + "/" + options.headRepoOptions.rev + "\r\n\r\n";
			return writeComment(options, message + "\r\n\r\n" + statusUrlMessage, callback);
		});
	});
};
