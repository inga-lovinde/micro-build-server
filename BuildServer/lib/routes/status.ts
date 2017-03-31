"use strict";

import * as express from "express";
import { parse } from "url";

import { getSettings } from "../settings-wrapper";
import { getReport } from "../status-processor";
import { Report } from "../types";

interface IOptions {
    readonly branchName: string;
    readonly owner: string;
    readonly reponame: string;
    readonly rev: string;
}

interface IOptionsWithReport extends IOptions {
    readonly report: Report;
}

const parseOptionsFromReferer = (path: string, callback: (err: string | null, options?: IOptions) => void) => {
    const pathParts = path.split("/").filter((value) => value);
    const [, secondPart, thirdPart] = pathParts;

    if (!secondPart) {
        return callback("BadRequest");
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

const createShowReport = (res: express.Response) => (err: string | null, inputOptions: IOptions | undefined) => {
    const options = {
        ...inputOptions || {},
        err,
    };

    res.render("status", options);
};

export const image: express.RequestHandler = (req, res) => {
    const getAdditionalOptions = (err: string | null, options?: IOptionsWithReport) => {
        if (err === "ReportFileNotFound") {
            return { status: "Building" };
        }

        if (err || !options) {
            return {
                message: err,
                status: "StatusError",
            };
        }

        if (options.report.err === "MBSNotFound") {
            return { status: "MBSNotUsed" };
        }

        if (options.report.err || !options.report.result) {
            return {
                message: options.report.err,
                status: "Error",
            };
        }

        const result = options.report.result;

        if ((result.warns.$allMessages || []).length) {
            const [firstWarn] = result.warns.$allMessages;

            return {
                message: firstWarn.message,
                status: "Warning",
            };
        }

        const allInfos = result.infos.$allMessages || [];

        if (allInfos.length) {
            return {
                message: allInfos[allInfos.length - 1].message,
                status: "OK",
            };
        }

        return { status: "OK" };
    };

    const handle = (err: string | null, options?: IOptionsWithReport) => {
        res.setHeader("Content-Type", "image/svg+xml");
        res.render("status-image", {
            ...options,
            ...getAdditionalOptions(err, options),
        });
    };

    parseOptionsFromReferer(parse(req.headers.referer || "").pathname || "", (err: string | null, options: IOptions) => {
        if (err) {
            return handle(err);
        }

        return getReport(getSettings(req.app), options, handle);
    });
};

export const page: express.RequestHandler = (req, res) => {
    const options = {
        branch: `/refs/heads/${req.params.branch}`,
        branchName: req.params.branch,
        owner: req.params.owner,
        reponame: req.params.reponame,
        rev: req.params.rev,
    };

    getReport(getSettings(req.app), options, createShowReport(res));
};

export const pageFromGithub: express.RequestHandler = (req, res) => parseOptionsFromReferer(req.params[0], (err, options) => {
    if (err || !options) {
        return createShowReport(res)(err, options);
    }

    return getReport(getSettings(req.app), options, createShowReport(res));
});
