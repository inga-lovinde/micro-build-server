"use strict";

var fs = require('fs'),
	builder = require('../lib/builder'),
	settings = require('../settings');

/*
 * POST from github
 */

var processPush = function (req, res, payload) {
	var repository = payload.repository;

	builder.build({
		app: req.app,
		url: repository.url,
		owner: repository.owner.name,
		reponame: repository.name,
		rev: payload.after,
		branch: payload.ref
	}, function (err, result) {
		console.log("Done processing request from GitHub");
		console.log("Error: " + err);
		//console.log("Result:");
		//console.log(result);
		res.send("Done processing request from GitHub\r\n" + "Error: " + err + "\r\n" + "Result: " + result);
	});
};

var getStatusMessage = function (options, callback) {
	var releaseDir = options.app.get('releasepath') + "/" + options.owner + "/" + options.reponame + "/" + options.branch + "/" + options.rev,
		reportFile = releaseDir + "/report.json";
	fs.exists(reportFile, function (exists) {
		if (!exists) {
			fs.exists(releaseDir, function (dirExists) {
				if (!dirExists) {
					return callback("Release directory not found");
				}
				if (options.lastAttempt) {
					return callback("Report file not found");
				}

				//maybe it is building right now
				options.lastAttempt = true;
				setTimeout(function () {
					getStatusMessage(options, callback);
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

var processPullRequest = function (req, res, payload) {
	var action = payload.action,
		number = payload.number,
		pullRequest = payload.pull_request,
		head = pullRequest.head,
		headRepo = head.repo,
		options = {
			app: req.app,
			url: headRepo.url,
			owner: headRepo.owner.name || headRepo.owner.login,
			reponame: headRepo.name,
			rev: head.sha,
			branch: "refs/heads/" + head.ref
		},
		baseRepo = payload.repository,
		baseOwner = baseRepo.owner.name || baseRepo.owner.login,
		baseReponame = baseRepo.name;

	if (action !== "opened" && action !== "reopened" && action !== "synchronize") {
		console.log("Got '" + action + "' event:");
		//console.log(req.body);
		return res.send("Only opened/reopened/synchronize actions are supported");
	}

	getStatusMessage(options, function (err, successMessage) {
		var message = err ? ("Was not built:\r\n\r\n" + err + "\r\n\r\nDO NOT MERGE!") : ("Build OK\r\n\r\n" + successMessage);
		settings.createGithub(baseOwner).issues.createComment({
			user: baseOwner,
			repo: baseReponame,
			number: number,
			body: message
		}, function (err) {
			if (err) {
				console.log("Unable to post comment: " + err);
			}

			res.send(err || "OK");
		});
	});
};

module.exports = function (req, res) {
	if (!req.body || (!req.body.payload && !req.body.repository)) {
		return res.end();
	}

	var eventType = req.header("x-github-event"),
		payload = req.body.payload ? JSON.parse(req.body.payload || "{}") : req.body;

	if (eventType === "push") {
		return processPush(req, res, payload);
	}

	if (eventType === "pull_request") {
		return processPullRequest(req, res, payload);
	}

	console.log("Got '" + eventType + "' event:");
	//console.log(req.body);
	return res.send("Only push/pull_request events are supported");
};
