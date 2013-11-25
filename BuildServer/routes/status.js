"use strict";

var fs = require('fs'),
	url = require('url');

var parseOptionsFromReferer = function (req, callback) {
	var pathParts = (url.parse(req.headers.referer || "").pathname || "").split("/");
	var result = {};
	if (pathParts.length < 3) {
		return callback("BadRequest", result);
	}

	result.owner = pathParts[1];
	result.reponame = pathParts[2];
	if (pathParts[3] && /^[\da-f]{40}$/i.test(pathParts[4])) {
		result.rev = pathParts[4];
		var branchFile = req.app.get('releasepath') + "/" + result.owner + "/" + result.reponame + "/$revs/" + result.rev + ".branch";
		fs.exists(branchFile, function (exists) {
			if (!exists) {
				return callback("BranchFileNotFound", result);
			}
			fs.readFile(branchFile, function (err, data) {
				if (err) {
					return callback(err, result);
				}
				result.branch = data.toString();
				result.branchName = result.branch.split("/").pop();
				return callback(null, result);
			});
		});
	} else {
		result.branchName = pathParts[4] || "master";
		result.branch = "refs/heads/" + result.branchName;
//		console.log(result);
		var revFile = req.app.get('releasepath') + "/" + result.owner + "/" + result.reponame + "/" + result.branch + "/latest.id";
		fs.exists(revFile, function (exists) {
			if (!exists) {
				return callback("RevFileNotFound", result);
			}
			fs.readFile(revFile, function (err, data) {
				if (err) {
					return callback(err, result);
				}
				result.rev = data.toString();
				return callback(null, result);
			});
		});
	}
};

var loadReport = function (app, options, callback) {
	var reportFile = app.get('releasepath') + "/" + options.owner + "/" + options.reponame + "/" + options.branch + "/" + options.rev + "/report.json";
	fs.exists(reportFile, function (exists) {
		if (!exists) {
			return callback("ReportFileNotFound", options);
		}

		fs.readFile(reportFile, function (err, data) {
			if (err) {
				return callback(err, options);
			}
			options.report = JSON.parse(data);
			return callback(null, options);
		});
	});
};

exports.image = function(req, res) {
//	console.log(req.headers);
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
		console.log(options);
	        res.setHeader('Content-Type', 'image/svg+xml');
		res.render('status-image', options);
	};

	parseOptionsFromReferer(req, function (err, options) {
		if (err) {
			return handle(err, options);
		}

		loadReport(req.app, options, function (err, options) {
			handle(err, options);
		});
	});
};

exports.page = function(req, res) {
};
