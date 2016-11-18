"use strict";

const builder = require('../lib/builder');
const commenter = require('../lib/commenter');

const processPush = (req, res, payload) => {
	const repository = payload.repository;
	const options = {
		app: req.app,
		url: repository.url,
		owner: repository.owner.name,
		reponame: repository.name,
		rev: payload.after,
		branch: payload.ref
	};

	console.log("Got push event for " + options.owner + "/" + options.reponame + ":" + options.branch);

	builder.build(options, (err, result) => {
		console.log("Done processing request from GitHub");
		console.log("Error: " + err);
		//console.log("Result:");
		//console.log(result);
		res.send("Done processing request from GitHub\r\n" + "Error: " + err + "\r\n" + "Result: " + result);
	});
};

const processPullRequest = (req, res, payload) => {
	const action = payload.action;
	const number = payload.number;
	const pullRequest = payload.pull_request;
	const head = pullRequest.head;
	const headRepo = head.repo;
	const headRepoOptions = {
		url: headRepo.url,
		owner: headRepo.owner.name || headRepo.owner.login,
		reponame: headRepo.name,
		rev: head.sha,
		branchname: head.ref,
		branch: "refs/heads/" + head.ref
	};
	const base = pullRequest.base;
	const baseRepo = base.repo;
	const baseRepoOptions = {
		owner: baseRepo.owner.name || baseRepo.owner.login,
		reponame: baseRepo.name,
		branchname: base.ref
	};
	const options = {
		app: req.app,
		action: action,
		number: number,
		headRepoOptions: headRepoOptions,
		baseRepoOptions: baseRepoOptions
	};
	const masterOptions = {
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
		(err, data) => {
			if (err) {
				console.log("Unable to post comment: " + err);
			}

			res.send(err || data);
		}
	);
};

module.exports = (req, res) => {
	if (!req.body || (!req.body.payload && !req.body.repository)) {
		return res.end();
	}

	const eventType = req.header("x-github-event");
	const payload = req.body.payload ? JSON.parse(req.body.payload || "{}") : req.body;

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
