"use strict";

const path = require("path");
const fs = require("fs");
const glob = require("glob");
const _ = require("underscore");

exports.writeReport = (releasePath, err, result, callback) => fs.writeFile(path.join(releasePath, "report.json"), JSON.stringify({
    "date": Date.now(),
    err,
    result
}), callback);

exports.loadReport = (app, options, callback) => {
    const releaseDir = path.join(app.get("releasepath"), options.owner, options.reponame, options.branch, options.rev);

    glob("**", {
        "cwd": releaseDir,
        "mark": true
    }, (err, files) => {
        if (err) {
            return callback(err, options);
        }

        const reportFile = path.join(releaseDir, "report.json");

        options.files = files;

        return fs.exists(reportFile, (exists) => {
            if (!exists) {
                return callback("ReportFileNotFound", options);
            }

            return fs.readFile(reportFile, (readErr, dataBuffer) => {
                if (readErr) {
                    return callback(readErr, options);
                }

                const data = dataBuffer.toString();

                if (!data) {
                    return callback("ReportFileNotFound", options);
                }
                options.report = JSON.parse(data);

                return callback(null, options);
            });
        });
    });
};

exports.getStatusMessageFromRelease = (app, options, callback) => {
    const releaseDir = path.join(app.get("releasepath"), options.owner, options.reponame, options.branch, options.rev);
    const reportFile = path.join(releaseDir, "/report.json");

    options.attemptsGetReport = (options.attemptsGetReport || 0) + 1;

    fs.exists(reportFile, (exists) => {
        if (!exists) {
            return setTimeout(() => fs.exists(releaseDir, (dirExists) => {
                if (!dirExists) {
                    return callback("Release directory not found. Probably repository hooks are not configured");
                }
                if (options.attemptsGetReport > 100) {
                    return callback("Report file not found");
                }

                // Maybe it is building right now
                return setTimeout(() => exports.getStatusMessageFromRelease(app, options, callback), 10000);
            }), 2000);
        }

        return setTimeout(() => fs.readFile(reportFile, (err, dataBuffer) => {
            if (err) {
                return callback(err);
            }

            const data = dataBuffer.toString();

            if (!data) {
                return callback("Report file not found");
            }

            const report = JSON.parse(data);

            if (report.result === "MBSNotFound") {
                return callback("mbs.json is not found");
            }
            if (report.result && ((report.result.errors || {}).$allMessages || []).length + ((report.result.warns || {}).$allMessages || []).length > 0) {
                return callback(_.map(
                    (report.result.errors || {}).$allMessages || [], (message) => `ERR: ${message.message}`
                ).concat(_.map(
                    (report.result.warns || {}).$allMessages || [], (message) => `WARN: ${message.message}`
                ))
               .join("\r\n"));
            }
            if (!report.result || report.err) {
                return callback(`CRITICAL ERROR: ${report.err}`);
            }
            if ((report.result.infos.$allMessages || []).length > 0) {
                return callback(null, report.result.infos.$allMessages[report.result.infos.$allMessages.length - 1].message);
            }

            return callback(null, "OK");
        }), 1000);
    });
};
