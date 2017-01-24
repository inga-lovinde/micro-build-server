"use strict";

const path = require("path");
const fs = require("fs");
const Archiver = require("archiver");

const getReport = (releasePath, callback) => {
    const reportFile = `${releasePath}report.json`;

    fs.exists(reportFile, (exists) => {
        if (!exists) {
            return callback(`ReportFileNotFound: ${reportFile}`);
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

    const year = date.getFullYear();
    const month = paddingLeft(date.getMonth() + 1, "00");
    const day = paddingLeft(date.getDate(), "00");
    const hours = paddingLeft(date.getHours(), "00");
    const minutes = paddingLeft(date.getMinutes(), "00");
    const seconds = paddingLeft(date.getSeconds(), "00");

    return `${year}.${month}.${day}.${hours}.${minutes}.${seconds}`;
};

module.exports = (req, res, next) => {
    const options = {
        "branch": `/refs/heads/${req.params.branch}`,
        "branchName": req.params.branch,
        "owner": req.params.owner,
        "reponame": req.params.reponame,
        "rev": req.params.rev
    };

    const releasePathParts = [req.app.get("releasepath"), options.owner, options.reponame, options.branch, options.rev, ""];

    const releasePath = path.normalize(releasePathParts.join("/"));

    getReport(releasePath, (err, report) => {
        if (err) {
            return next(err);
        }

        const archive = new Archiver("zip");

        archive.on("error", next);
        res.attachment(`${options.reponame}.${getDatePart(report)}.${options.rev}.zip`, ".");
        archive.pipe(res);
        archive.directory(releasePath, false);

        return archive.finalize();
    });
};
