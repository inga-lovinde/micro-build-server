"use strict";

const path = require("path");
const fs = require("fs");
const _ = require("underscore");
const settings = require("../settings");

const featureNamePattern = /^feature-(\d+)(?:-[a-zA-Z0-9]+)+$/;
const versionNamePattern = /^v\d+(\.\d+)*$/;
const masterNamePattern = /^master$/;

const writeComment = (options, message, callback) => options.github.issues.createComment({
    "body": message,
    "number": options.number,
    "owner": options.baseRepoOptions.owner,
    "repo": options.baseRepoOptions.reponame
}, callback);

const closePullRequest = (options, message, callback) => writeComment(options, message, (err) => {
    if (err) {
        return callback(err);
    }

    return options.github.issues.edit({
        "number": options.number,
        "owner": options.baseRepoOptions.owner,
        "repo": options.baseRepoOptions.reponame,
        "state": "closed"
    }, callback);
});

const checkHasIssue = (options, issueNumber, callback) => options.github.issues.get({
    "number": issueNumber,
    "owner": options.baseRepoOptions.owner,
    "repo": options.baseRepoOptions.reponame
}, (err, result) => {
    if (err && err.code !== 404) {
        return callback(err);
    }

    if (err || result.number.toString() !== issueNumber) {
        return callback(null, false);
    }

    if (result.pull_request && result.pull_request.url) {
        return callback(null, false);
    }

    return callback(null, true, result.title);
});

const checkHasReleases = (options, callback) => options.github.repos.getReleases({
    "owner": options.baseRepoOptions.owner,
    "per_page": 1,
    "repo": options.baseRepoOptions.reponame
}, (err, result) => {
    if (err) {
        return callback(err);
    }

    return callback(null, result && result.length);
});

const checkPullRequest = (options, callback) => {
    const head = options.headRepoOptions;
    const base = options.baseRepoOptions;

    if (head.reponame !== base.reponame) {
        return closePullRequest(options, "Base and head repository names should match", callback);
    }

    if (head.owner === base.owner) {
        if (!versionNamePattern.test(head.branchname) || !masterNamePattern.test(base.branchname)) {
            return closePullRequest(options, "Only merging from version to master is allowed", callback);
        }

        return checkHasReleases(options, (err, hasReleases) => {
            if (err) {
                return writeComment(options, "Unable to check for releases", callback);
            }

            if (!hasReleases) {
                return closePullRequest(options, "Merging from version to master is only allowed for repositories with releases", callback);
            }

            if (options.action === "opened") {
                return writeComment(options, `Switching master branch to ${head.branchname} release`, callback);
            }

            return process.nextTick(callback);
        });
    }

    if (!featureNamePattern.test(head.branchname)) {
        return closePullRequest(options, `Only merging from feature branch is allowed (pattern: \`${featureNamePattern}\`)`, callback);
    }

    if (!versionNamePattern.test(base.branchname) && !masterNamePattern.test(base.branchname)) {
        return closePullRequest(options, `Only merging to master or version branch is allowed; merging to '${base.branchname}'  is not supported`, callback);
    }

    const issueNumber = featureNamePattern.exec(head.branchname)[1];

    return checkHasIssue(options, issueNumber, (err, hasIssue, issueTitle) => {
        if (err) {
            return writeComment(options, `Unable to check for issue:\r\n\r\n${err.message}`, callback);
        }

        if (!hasIssue) {
            return closePullRequest(options, `Unable to find issue #${issueNumber}`, callback);
        }

        const shouldHaveReleases = versionNamePattern.test(base.branchname);

        return checkHasReleases(options, (err, hasReleases) => {
            if (err) {
                return writeComment(options, "Unable to check for releases", callback);
            }

            if (shouldHaveReleases && !hasReleases) {
                return closePullRequest(options, "Merging from feature to version is only allowed for repositories with releases", callback);
            }

            if (!shouldHaveReleases && hasReleases) {
                return closePullRequest(options, "Merging from feature to master is only allowed for repositories without releases", callback);
            }

            if (options.action === "opened") {
                return writeComment(options, `Merging feature #${issueNumber} (${issueTitle}) to ${base.branchname}${shouldHaveReleases ? " release" : ""}`, callback);
            }

            return process.nextTick(callback);
        });
    });
};

const getStatusMessageFromRelease = (app, options, callback) => {
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
                return setTimeout(() => getStatusMessageFromRelease(app, options, callback), 10000);
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

exports.commentOnPullRequest = (options, callback) => {
    options.github = settings.createGithub(options.baseRepoOptions.owner);

    return checkPullRequest(options, (err, successMessage) => getStatusMessageFromRelease(options.app, options.headRepoOptions, (err, successMessage) => {
        const escapedErr = err.substring(0, 64000).replace(/`/g, "` ");
        const message = err
            ? `Was not built:\r\n\r\n\`\`\`\r\n${escapedErr}\r\n\`\`\`\r\n\r\nDO NOT MERGE!`
            : `Build OK\r\n\r\n${successMessage}`;
        const statusUrlMessage = `Build status URL: ${settings.siteRoot}status/${options.headRepoOptions.owner}/${options.headRepoOptions.reponame}/${options.headRepoOptions.rev}\r\n\r\n`;

        return writeComment(options, `${message}\r\n\r\n${statusUrlMessage}`, callback);
    }));
};
