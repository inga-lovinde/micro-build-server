"use strict";

var builder = require('../lib/builder');

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

module.exports = function (req, res) {
	if (!req.body || (!req.body.payload && !req.body.repository)) {
		return res.end();
	}

	var eventType = req.header("x-github-event"),
		payload = req.body.payload ? JSON.parse(req.body.payload || "{}") : req.body;

	if (eventType === "push") {
		return processPush(req, res, payload);
	}

	console.log("Got '" + eventType + "' event:");
	//console.log(req.body);
	return res.send("Only push events are supported");
};
