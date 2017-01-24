"use strict";

const url = require("url");
const statusProcessor = require("../lib/status-processor");

const parseOptionsFromReferer = (path, callback) => {
    const pathParts = path.split("/").filter((value) => value);
    const result = {};
    const [, secondPart, thirdPart] = pathParts;

    if (!secondPart) {
        return callback("BadRequest", result);
    }

    if (thirdPart === "tree") {
        [result.owner, result.reponame, , result.branchName, result.rev] = pathParts;
    } else {
        [result.owner, result.reponame, result.branchName, result.rev] = pathParts;
    }

    return callback(null, result);
};

const createShowReport = (res) => (err, inputOptions) => {
    const options = inputOptions || {};

    options.err = err;
    res.render("status", options);
};

exports.image = (req, res) => {
    const handle = (err, options) => {
        if (err === "ReportFileNotFound") {
            options.status = "Building";
        } else if (err) {
            options.status = "StatusError";
            options.message = err;
        } else if (options.report.result === "MBSNotFound") {
            options.status = "MBSNotUsed";
        } else if (options.report.err) {
            options.status = "Error";
            options.message = options.report.err;
        } else if ((options.report.result.warns.$allMessages || []).length) {
            const [firstWarn] = options.report.result.warns.$allMessages;

            options.status = "Warning";
            options.message = firstWarn.message;
        } else {
            options.status = "OK";
            if ((options.report.result.infos.$allMessages || []).length) {
                options.message = options.report.result.infos.$allMessages[options.report.result.infos.$allMessages.length - 1].message;
            }
        }
        res.setHeader("Content-Type", "image/svg+xml");
        res.render("status-image", options);
    };

    parseOptionsFromReferer(url.parse(req.headers.referer || "").pathname || "", (err, options) => {
        if (err) {
            return handle(err, options);
        }

        return statusProcessor.getReport(req.app, options, handle);
    });
};

exports.page = (req, res) => {
    const options = {
        "branch": `/refs/heads/${req.params.branch}`,
        "branchName": req.params.branch,
        "owner": req.params.owner,
        "reponame": req.params.reponame,
        "rev": req.params.rev
    };

    statusProcessor.getReport(req.app, options, createShowReport(res));
};

exports.pageFromGithub = (req, res) => parseOptionsFromReferer(req.params[0], (err, options) => {
    if (err) {
        return createShowReport(err, options);
    }

    return statusProcessor.getReport(req.app, options, createShowReport(res));
});
