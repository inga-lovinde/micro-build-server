"use strict";

const path = require('path');
const fs = require('fs');
const Zip = require('adm-zip');

const getReport = (releasePath, callback) => {
	const reportFile = releasePath + "report.json";

	fs.exists(reportFile, (exists) => {
		if (!exists) {
			return callback("ReportFileNotFound: " + reportFile);
		}

		return fs.readFile(reportFile, (err, dataBuffer) => {
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

const getDatePart = (report) => {
	if (!report.date) {
		return "unknowndate";
	}

	const date = new Date(report.date);
	const paddingLeft = (str, paddingValue) => String(paddingValue + str).slice(-paddingValue.length);

	return date.getFullYear() + "." +
		paddingLeft(date.getMonth() + 1, "00") + "." +
		paddingLeft(date.getDate(), "00") + "." +
		paddingLeft(date.getHours(), "00") + "." +
		paddingLeft(date.getMinutes(), "00") + "." +
		paddingLeft(date.getSeconds(), "00");
};

module.exports = (req, res, next) => {
	const options = {
		owner: req.params.owner,
		reponame: req.params.reponame,
		branchName: req.params.branch,
		branch: "/refs/heads/" + req.params.branch,
		rev: req.params.rev
	};

	const zip = new Zip();
	const releasePath = path.normalize(req.app.get('releasepath') + "/" + options.owner + "/" + options.reponame + "/" + options.branch + "/" + options.rev + "/");

	getReport(releasePath, (err, report) => {
		if (err) {
			return next(err);
		}

		zip.addLocalFolder(releasePath);
		zip.toBuffer((buffer) => {
			res.attachment(options.reponame + '.' + getDatePart(report) + '.' + options.rev + '.zip', '.');
			res.send(buffer);
		}, (error) => next(error), () => { }, () => { });
	});
};
