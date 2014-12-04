"use strict";

var path = require('path'),
	fs = require('fs'),
	Zip = require('adm-zip');

var getReport = function(releasePath, callback) {
	var reportFile = releasePath + "/report.json";

	fs.exists(reportFile, function (exists) {
		if (!exists) {
			return callback("ReportFileNotFound");
		}

		return fs.readFile(reportFile, function (err, dataBuffer) {
			if (err) {
				return callback(err, options);
			}
			var data = dataBuffer.toString();
			if (!data) {
				return callback("ReportFileNotFound", options);
			}
			var report = JSON.parse(data);
			return callback(null, report);
		});
	});
};

var getDatePart = function (report) {
	if (!report.date) {
		return "unknowndate";
	}

	var date = new Date(report.date),
		paddingLeft = function (str, paddingValue) {
			return String(paddingValue + str).slice(-paddingValue.length);
		};

	return date.getFullYear() + "." +
		paddingLeft(date.getMonth() + 1, "00") + "." +
		paddingLeft(date.getDate(), "00") + "." +
		paddingLeft(date.getHours(), "00") + "." +
		paddingLeft(date.getMinutes(), "00") + "." +
		paddingLeft(date.getSeconds(), "00");
};

module.exports = function(req, res, next) {
	var options = {
		owner: req.params.owner,
		reponame: req.params.reponame,
		branchName: req.params.branch,
		branch: "/refs/heads/" + req.params.branch,
		rev: req.params.rev
	};

	var zip = new Zip(),
		releasePath = path.normalize(req.app.get('releasepath') + "/" + options.owner + "/" + options.reponame + "/" + options.branch + "/" + options.rev + "/");

	getReport(releasePath, function (err, report) {
		if (err) {
			return next(err);
		}

		zip.addLocalFolder(releasePath);
		zip.toBuffer(function (buffer) {
			res.attachment(options.reponame + '.' + getDatePart(report) + '.' + options.rev + '.zip', '.');
			res.send(buffer);
		}, function (error) {
			next(error);
		}, function () { }, function () { });
	});
};
