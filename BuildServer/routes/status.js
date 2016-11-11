"use strict";

const url = require('url');
const statusProcessor = require('../lib/status-processor');

const parseOptionsFromReferer = function (path, callback) {
	const pathParts = path.split("/").filter(function (value) { return value; });
	const result = {};

	if (pathParts.length < 2) {
		return callback("BadRequest", result);
	}

	if (pathParts[2] === "tree") {
		pathParts.splice(2, 1);
	}

	result.owner = pathParts[0];
	result.reponame = pathParts[1];
	result.branchName = pathParts[2];
	result.rev = pathParts[3];
	return callback(null, result);
};

const createShowReport = function (res) {
	return function (err, options) {
		options = options || {};
		options.err = err;
		res.render('status', options);
	};
};

exports.image = function(req, res) {
	const handle = function (err, options) {
		if (err === "ReportFileNotFound") {
			options.status = "Building";
		} else if (err) {
			options.status = "StatusError";
			options.message = err;
		} else if (options.report.result === "MBSNotFound") {
			options.status = "MBSNotUsed";
		} else if (options.report.err) {
			options.status = "Error";
			options.message = options.report.err;
		} else if ((options.report.result.warns.$allMessages || []).length > 0) {
			options.status = "Warning";
			options.message = options.report.result.warns.$allMessages[0].message;
		} else {
			options.status = "OK";
			if ((options.report.result.infos.$allMessages || []).length > 0) {
				options.message = options.report.result.infos.$allMessages[options.report.result.infos.$allMessages.length-1].message;
			}
		}
		res.setHeader('Content-Type', 'image/svg+xml');
		res.render('status-image', options);
	};

	parseOptionsFromReferer(url.parse(req.headers.referer || "").pathname || "", function (err, options) {
		if (err) {
			return handle(err, options);
		}

		statusProcessor.getReport(req.app, options, function (err, options) {
			handle(err, options);
		});
	});
};

exports.page = function(req, res) {
	const options = {
		owner: req.params.owner,
		reponame: req.params.reponame,
		branchName: req.params.branch,
		branch: "/refs/heads/" + req.params.branch,
		rev: req.params.rev
	};

	statusProcessor.getReport(req.app, options, createShowReport(res));
};

exports.pageFromGithub = function (req, res) {
	parseOptionsFromReferer(req.params[0], function (err, options) {
		if (err) {
			return createShowReport(err, options);
		}

		return statusProcessor.getReport(req.app, options, createShowReport(res));
	});
};
