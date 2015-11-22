"use strict";

var builder = require('../lib/builder'),
	commenter = require('../lib/commenter');

/*
 * POST from github
 */

var processPush = function (req, res, payload) {
	var repository = payload.repository,
		options = {
			app: req.app,
			url: repository.url,
			owner: repository.owner.name,
			reponame: repository.name,
			rev: payload.after,
			branch: payload.ref
		};

	console.log("Got push event for " + options.owner + "/" + options.reponame + ":" + options.branch);

	builder.build(options, function (err, result) {
		console.log("Done processing request from GitHub");
		console.log("Error: " + err);
		//console.log("Result:");
		//console.log(result);
		res.send("Done processing request from GitHub\r\n" + "Error: " + err + "\r\n" + "Result: " + result);
	});
};

var processPullRequest = function (req, res, payload) {
	var action = payload.action,
		number = payload.number,
		pullRequest = payload.pull_request,
		head = pullRequest.head,
		headRepo = head.repo,
		headRepoOptions = {
			url: headRepo.url,
			owner: headRepo.owner.name || headRepo.owner.login,
			reponame: headRepo.name,
			rev: head.sha,
			branchname: head.ref,
			branch: "refs/heads/" + head.ref
		},
		base = pullRequest.base,
		baseRepo = base.repo,
		baseRepoOptions = {
			owner: baseRepo.owner.name || baseRepo.owner.login,
			reponame: baseRepo.name,
			branchname: base.ref
		},
		options = {
			app: req.app,
			action: action,
			number: number,
			headRepoOptions: headRepoOptions,
			baseRepoOptions: baseRepoOptions
		},
		masterOptions = {
			app: req.app,
			action: action,
			number: number,
			headRepoOptions: baseRepoOptions,
			baseRepoOptions: baseRepoOptions
		};

	console.log("Got pull request " + action + " event, from " + headRepoOptions.owner + "/" + headRepoOptions.reponame + ":" + headRepoOptions.branchname + " (" + headRepoOptions.rev + ") to " + baseRepoOptions.owner + "/" + baseRepoOptions.reponame + ":" + baseRepoOptions.branchname);

	if (action !== "opened" && action !== "reopened" && action !== "synchronize" && action !== "closed") {
		//console.log("Got '" + action + "' event:");
		//console.log(req.body);
		return res.send("Only opened/reopened/synchronize/closed actions are supported");
	}

	if (action === "closed" && !pullRequest.merged) {
		console.log("Pull request closed without merging");
		return res.send("Pull request closed without merging");
	}

	if (action === "closed") {
		return res.send("");
	}

	commenter.commentOnPullRequest(
		action === "closed" ? masterOptions : options,
		function (err, data) {
			if (err) {
				console.log("Unable to post comment: " + err);
			}

			res.send(err || data);
		}
	);
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
