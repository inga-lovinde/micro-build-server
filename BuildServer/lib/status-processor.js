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

var parseOptions = function (app, options, callback) {
	var result = {};

	result.owner = options.owner;
	result.reponame = options.reponame;

	if (options.rev && !/^[\da-f]{40}$/i.test(options.rev)) {
		return callback("Wrong rev format: " + options.rev, options);
	}

	if (options.rev) {
		result.rev = options.rev;
		return addBranchInfo(app, result, callback);
	} else if (/^[\da-f]{40}$/i.test(options.branchName)) {
		result.rev = options.branchName;
		return addBranchInfo(app, result, callback);
	} else {
		result.branchName = options.branchName || "master";
		result.branch = "refs/heads/" + result.branchName;
		return addRevInfo(app, result, callback);
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

exports.getReport = function (app, options, callback) {
	parseOptions(app, options, function (err, result) {
		if (err) {
			return callback(err);
		}

		return loadReport(app, result, callback);
	});
}
