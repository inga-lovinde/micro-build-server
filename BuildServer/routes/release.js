"use strict";

const path = require('path');
const fs = require('fs');
const Zip = require('adm-zip');

const getReport = function(releasePath, callback) {
	const reportFile = releasePath + "report.json";

	fs.exists(reportFile, function (exists) {
		if (!exists) {
			return callback("ReportFileNotFound: " + reportFile);
		}

		return fs.readFile(reportFile, function (err, dataBuffer) {
			if (err) {
				return callback(err, reportFile);
			}
			const data = dataBuffer.toString();
			if (!data) {
				return callback("ReportFileNotFound", reportFile);
			}
			const report = JSON.parse(data);
			return callback(null, report);
		});
	});
};

const getDatePart = function (report) {
	if (!report.date) {
		return "unknowndate";
	}

	const date = new Date(report.date);
	const paddingLeft = function (str, paddingValue) {
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
	const options = {
		owner: req.params.owner,
		reponame: req.params.reponame,
		branchName: req.params.branch,
		branch: "/refs/heads/" + req.params.branch,
		rev: req.params.rev
	};

	const zip = new Zip();
	const releasePath = path.normalize(req.app.get('releasepath') + "/" + options.owner + "/" + options.reponame + "/" + options.branch + "/" + options.rev + "/");

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
