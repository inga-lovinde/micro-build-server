"use strict";

var fs = require('fs'),
	url = require('url'),
	glob = require('glob'),
	statusProcessor = require('../lib/status-processor');

var parseOptionsFromReferer = function (path, callback) {
	var pathParts = path.split("/");
	var result = {};
	if (pathParts.length < 3) {
		return callback("BadRequest", result);
	}

	result.owner = pathParts[1];
	result.reponame = pathParts[2];
	result.branchName = pathParts[3];
	result.rev = pathParts[4];
	return callback(null, result);
};

var createShowReport = function (res) {
	return function (err, options) {
		options = options || {};
		options.err = err;
		res.render('status', options);
	}
}

exports.image = function(req, res) {
	var handle = function (err, options) {
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
	var options = {
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
			return showReport(err, options);
		}

		return statusProcessor.getReport(req.app, options, createShowReport(res));
	});
}

