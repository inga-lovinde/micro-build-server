"use strict";

const path = require("path");
const fs = require("fs");
const zlib = require("zlib");
const glob = require("glob");
const streamBuffers = require("stream-buffers");
const _ = require("underscore");

const reportFilename = "report.json.gz";

const writeReport = (releaseDir, err, result, callback) => {
    const readable = new streamBuffers.ReadableStreamBuffer();

    readable
        .pipe(zlib.createGzip())
        .pipe(fs.createWriteStream(path.join(releaseDir, reportFilename)))
        .on("error", callback)
        .on("finish", callback);

    readable.put(JSON.stringify({
        "date": Date.now(),
        err,
        result
    }));
    readable.stop();
};

const readReport = (releaseDir, callback) => {
    const writable = new streamBuffers.WritableStreamBuffer();
    const readStream = fs.createReadStream(path.join(releaseDir, reportFilename));

    readStream
        .pipe(zlib.createGunzip())
        .pipe(writable)
        .on("error", callback)
        .on("finish", () => {
            const data = writable.getContentsAsString();

            if (!data) {
                return callback("ReportFileNotFound");
            }

            return callback(null, JSON.parse(data));
        });
};

exports.writeReport = writeReport;

exports.loadReport = (app, options, callback) => {
    const releaseDir = path.join(app.get("releasepath"), options.owner, options.reponame, options.branch, options.rev);

    glob("**", {
        "cwd": releaseDir,
        "mark": true
    }, (err, files) => {
        if (err) {
            return callback(err, options);
        }

        const reportFile = path.join(releaseDir, reportFilename);

        options.files = files;

        return fs.exists(reportFile, (exists) => {
            if (!exists) {
                return callback("ReportFileNotFound", options);
            }

            return readReport(releaseDir, (readErr, report) => {
                if (readErr) {
                    return callback(readErr, options);
                }

                options.report = report;

                return callback(null, options);
            });
        });
    });
};

exports.getStatusMessageFromRelease = (app, options, callback) => {
    const releaseDir = path.join(app.get("releasepath"), options.owner, options.reponame, options.branch, options.rev);
    const reportFile = path.join(releaseDir, reportFilename);

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

        return setTimeout(() => readReport(releaseDir, (readErr, report) => {
            if (readErr) {
                return callback(readErr);
            }

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
