"use strict";

import { createReadStream, createWriteStream, exists } from "fs";
import * as glob from "glob";
import * as JSONParse from "json-parse-safe";
import { join } from "path";
import { ReadableStreamBuffer, WritableStreamBuffer } from "stream-buffers";
import * as _ from "underscore";
import { createGunzip, createGzip } from "zlib";

import { Message, Report, ReportResult } from "../types";

const reportFilename = "report.json.gz";
const maxAttemptsNumber = 100;
const attemptsTimeout = 30000;
const reportReadTimeout = 5000;
const directoryCheckTimeout = 2000;
const attemptsDebugFrequency = 10;

const readableStreamBufferOptions = {
    chunkSize: 262144,
    frequency: 1,
};

const getAllErrors = (report: Report): Message[] => (report.result && report.result.errors && report.result.errors.$allMessages) || [];
const getAllWarns = (report: Report): Message[] => (report.result && report.result.warns && report.result.errors.$allMessages) || [];
const getAllInfos = (report: Report): Message[] => (report.result && report.result.infos && report.result.errors.$allMessages) || [];

export const writeReport = (releaseDir, err, result: ReportResult | undefined, callback) => {
    const data = JSON.stringify({
        date: Date.now(),
        err,
        result,
    } as Report);

    const readable = new ReadableStreamBuffer(readableStreamBufferOptions);
    const writeStream = createWriteStream(join(releaseDir, reportFilename));

    readable
        .on("error", callback)
        .pipe(createGzip())
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

export const readReport = (releaseDir, callback) => {
    const readStream = createReadStream(join(releaseDir, reportFilename));
    const writable = new WritableStreamBuffer();

    readStream
        .on("error", callback)
        .pipe(createGunzip())
        .on("error", callback)
        .pipe(writable)
        .on("error", callback)
        .on("finish", () => {
            readStream.destroy();

            const data = writable.getContentsAsString();
            if (!data) {
                return callback("ReportFileNotFound");
            }

            const { error, value }: { error: any, value?: Report } = JSONParse(data);
            if (error) {
                return callback("ReportFileMalformed");
            }

            return callback(null, value);
        });
};

export const loadReport = (app, options, callback) => {
    const releaseDir = join(app.get("releasepath"), options.owner, options.reponame, options.branch, options.rev);

    glob("**", {
        cwd: releaseDir,
        mark: true,
    }, (err, files) => {
        if (err) {
            return callback(err, options);
        }

        const reportFile = join(releaseDir, reportFilename);

        return exists(reportFile, (reportFileExists) => {
            if (!reportFileExists) {
                return callback("ReportFileNotFound", options);
            }

            return readReport(releaseDir, (readErr, report) => {
                if (readErr) {
                    return callback(readErr, {
                        ...options,
                        files,
                    });
                }

                return callback(null, {
                    ...options,
                    files,
                    report,
                });
            });
        });
    });
};

export const getStatusMessageFromRelease = (app, originalOptions, callback) => {
    const options = {
        ...originalOptions,
        attemptsGetReport: (Number(originalOptions.attemptsGetReport) || Number()) + 1,
    };
    const releaseDir = join(app.get("releasepath"), options.owner, options.reponame, options.branch, options.rev);
    const reportFile = join(releaseDir, reportFilename);

    exists(reportFile, (reportFileExists) => {
        if (!reportFileExists) {
            return setTimeout(() => exists(releaseDir, (dirExists) => {
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
                const formattedErrors = _.map(errors, (message) => `ERR: ${message.message}`);
                const formattedWarns = _.map(warns, (message) => `WARN: ${message.message}`);

                return callback(formattedErrors.concat(formattedWarns).join("\r\n"));
            }

            if (!report.result || report.err) {
                return callback(`CRITICAL ERROR: ${report.err}`);
            }

            return callback(null, (infos[infos.length - 1] || { message: "OK" }).message);
        }), reportReadTimeout);
    });
};
