"use strict";

import * as _ from "underscore";
import { parse } from "url";

import { getReport } from "../status-processor";

const parseOptionsFromReferer = (path, callback) => {
    const pathParts = path.split("/").filter((value) => value);
    const [, secondPart, thirdPart] = pathParts;

    if (!secondPart) {
        return callback("BadRequest", {});
    }

    if (thirdPart === "tree") {
        const [owner, reponame, , branchName, rev] = pathParts;

        return callback(null, {
            branchName,
            owner,
            reponame,
            rev,
        });
    }

    const [owner, reponame, branchName, rev] = pathParts;

    return callback(null, {
        branchName,
        owner,
        reponame,
        rev,
    });
};

const createShowReport = (res) => (err, inputOptions) => {
    const options = {
        ...inputOptions || {},
        err,
    };

    res.render("status", options);
};

export const image = (req, res) => {
    const getAdditionalOptions = (err, options) => {
        if (err === "ReportFileNotFound") {
            return { status: "Building" };
        }

        if (err) {
            return {
                message: err,
                status: "StatusError",
            };
        }

        if (options.report.result === "MBSNotFound") {
            return { status: "MBSNotUsed" };
        }

        if (options.report.err) {
            return {
                message: options.report.err,
                status: "Error",
            };
        }

        if ((options.report.result.warns.$allMessages || []).length) {
            const [firstWarn] = options.report.result.warns.$allMessages;

            return {
                message: firstWarn.message,
                status: "Warning",
            };
        }

        const allInfos = options.report.result.infos.$allMessages || [];

        if (allInfos.length) {
            return {
                message: allInfos[allInfos.length - 1].message,
                status: "OK",
            };
        }

        return { status: "OK" };
    };

    const handle = (err, options) => {
        res.setHeader("Content-Type", "image/svg+xml");
        res.render("status-image", {
            ...options,
            ...getAdditionalOptions(err, options),
        });
    };

    parseOptionsFromReferer(parse(req.headers.referer || "").pathname || "", (err, options) => {
        if (err) {
            return handle(err, options);
        }

        return getReport(req.app, options, handle);
    });
};

export const page = (req, res) => {
    const options = {
        branch: `/refs/heads/${req.params.branch}`,
        branchName: req.params.branch,
        owner: req.params.owner,
        reponame: req.params.reponame,
        rev: req.params.rev,
    };

    getReport(req.app, options, createShowReport(res));
};

export const pageFromGithub = (req, res) => parseOptionsFromReferer(req.params[0], (err, options) => {
    if (err) {
        return createShowReport(res)(err, options);
    }

    return getReport(req.app, options, createShowReport(res));
});
