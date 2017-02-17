"use strict";

const path = require("path");
const fs = require("fs");
const zlib = require("zlib");
const glob = require("glob");
const streamBuffers = require("stream-buffers");
const _ = require("underscore");

const reportFilename = "report.json.gz";
const maxAttemptsNumber = 100;
const attemptsTimeout = 30000;
const reportReadTimeout = 5000;
const directoryCheckTimeout = 2000;
const attemptsDebugFrequency = 10;

const readableStreamBufferOptions = {
    "chunkSize": 262144,
    "frequency": 1
};

const getAllErrors = (report) => ((report.result || {}).errors || {}).$allMessages || [];
const getAllWarns = (report) => ((report.result || {}).warns || {}).$allMessages || [];
const getAllInfos = (report) => ((report.result || {}).infos || {}).$allMessages || [];

const writeReport = (releaseDir, err, result, callback) => {
    const data = JSON.stringify({
        "date": Date.now(),
        err,
        result
    });

    const readable = new streamBuffers.ReadableStreamBuffer(readableStreamBufferOptions);
    const writeStream = fs.createWriteStream(path.join(releaseDir, reportFilename));

    readable
        .on("error", callback)
        .pipe(zlib.createGzip())
        .on("error", callback)
        .pipe(writeStream)
        .on("error", callback)
        .on("finish", () => {
            writeStream.end();
            callback();
        });

    readable.put(data);
    readable.stop();
};

const readReport = (releaseDir, callback) => {
    const readStream = fs.createReadStream(path.join(releaseDir, reportFilename));
    const writable = new streamBuffers.WritableStreamBuffer();

    readStream
        .on("error", callback)
        .pipe(zlib.createGunzip())
        .on("error", callback)
        .pipe(writable)
        .on("error", callback)
        .on("finish", () => {
            readStream.destroy();

            const data = writable.getContentsAsString();

            if (!data) {
                return callback("ReportFileNotFound");
            }

            return callback(null, JSON.parse(data));
        });
};

exports.readReport = readReport;

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

    options.attemptsGetReport = (Number(options.attemptsGetReport) || Number()) + 1;

    fs.exists(reportFile, (exists) => {
        if (!exists) {
            return setTimeout(() => fs.exists(releaseDir, (dirExists) => {
                if (!dirExists) {
                    return callback("Release directory not found. Probably repository hooks are not configured");
                }

                if (options.attemptsGetReport > maxAttemptsNumber) {
                    return callback("Report file not found");
                }

                // Maybe it is building right now
                if (!(options.attemptsGetReport % attemptsDebugFrequency) && options.onTenthAttempt) {
                    options.onTenthAttempt();
                }

                return setTimeout(() => exports.getStatusMessageFromRelease(app, options, callback), attemptsTimeout);
            }), directoryCheckTimeout);
        }

        return setTimeout(() => readReport(releaseDir, (readErr, report) => {
            if (readErr) {
                return callback(readErr);
            }

            if (report.result === "MBSNotFound") {
                return callback("mbs.json is not found");
            }

            const errors = getAllErrors(report);
            const warns = getAllWarns(report);
            const infos = getAllInfos(report);

            if (errors.length + warns.length) {
                return callback(_.map(
                    errors, (message) => `ERR: ${message.message}`
                ).concat(_.map(
                    warns, (message) => `WARN: ${message.message}`
                ))
               .join("\r\n"));
            }

            if (!report.result || report.err) {
                return callback(`CRITICAL ERROR: ${report.err}`);
            }

            return callback(null, (infos[infos.length - 1] || { "message": "OK" }).message);
        }), reportReadTimeout);
    });
};
