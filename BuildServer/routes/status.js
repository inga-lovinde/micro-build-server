"use strict";

var fs = require('fs'),
	url = require('url'),
	glob = require('glob');

var addBranchInfo = function (app, options, callback) {
	var branchFile = app.get('releasepath') + "/" + options.owner + "/" + options.reponame + "/$revs/" + options.rev + ".branch";
	fs.exists(branchFile, function (exists) {
		if (!exists) {
			return callback("BranchFileNotFound", options);
		}
		fs.readFile(branchFile, function (err, data) {
			if (err) {
				return callback(err, result);
			}
			options.branch = data.toString();
			options.branchName = options.branch.split("/").pop();
			return callback(null, options);
		});
	});
};

var addRevInfo = function (app, options, callback) {
	var revFile = app.get('releasepath') + "/" + options.owner + "/" + options.reponame + "/" + options.branch + "/latest.id";
	fs.exists(revFile, function (exists) {
		if (!exists) {
			return callback("RevFileNotFound", options);
		}
		fs.readFile(revFile, function (err, data) {
			if (err) {
				return callback(err, options);
			}
			options.rev = data.toString();
			return callback(null, options);
		});
	});
};

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
		return addBranchInfo(req.app, result, callback);
	} else {
		result.branchName = pathParts[4] || "master";
		result.branch = "refs/heads/" + result.branchName;
		return addRevInfo(req.app, result, callback);
	}
};

var loadReport = function (app, options, callback) {
	var releaseDir = app.get('releasepath') + "/" + options.owner + "/" + options.reponame + "/" + options.branch + "/" + options.rev;

	glob("**", {cwd: releaseDir, mark: true}, function (err, files) {
		if (err) {
			return callback(err, options);
		}

		var reportFile = releaseDir + "/report.json";
		options.files = files;
		fs.exists(reportFile, function (exists) {
			if (!exists) {
				return callback("ReportFileNotFound", options);
			}

			fs.readFile(reportFile, function (err, dataBuffer) {
				if (err) {
					return callback(err, options);
				}
				var data = dataBuffer.toString();
				if (!data) {
					return callback("ReportFileNotFound", options);
				}
				options.report = JSON.parse(data);
				return callback(null, options);
			});
		});
	});
};

exports.image = function(req, res) {
	console.log(req.headers);
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
//	console.log(req);
	var options = {
		owner: req.params.owner,
		reponame: req.params.reponame,
		branchName: req.params.branch,
		branch: "/refs/heads/" + req.params.branch,
		rev: req.params.rev
	};
	var finish = function (err, options) {
		loadReport(req.app, options, function (err, options) {
			options.err = err;
			console.log(options);
			res.render('status', options);
		});
	};

	if (/^[\da-f]{40}$/i.test(options.branchName)) {
		options.rev = options.branchName;
		options.branchName = undefined;
		options.branch = undefined;
		return addBranchInfo(req.app, options, finish);
	} else {
		return finish(undefined, options);
	}
};
