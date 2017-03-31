"use strict";

import { create as createArchiver } from "archiver";
import * as express from "express";
import { join } from "path";

import { readReport } from "../report-processor";
import { getSettings } from "../settings-wrapper";
import { Report } from "../types";

const getDatePart = (report: Report) => {
    if (!report.date) {
        return "unknowndate";
    }

    const date = new Date(report.date);
    const paddingLeft = (str: string | number, paddingValue: string) => String(paddingValue + str).slice(-paddingValue.length);

    const year = date.getFullYear();
    const month = paddingLeft(date.getMonth() + 1, "00");
    const day = paddingLeft(date.getDate(), "00");
    const hours = paddingLeft(date.getHours(), "00");
    const minutes = paddingLeft(date.getMinutes(), "00");
    const seconds = paddingLeft(date.getSeconds(), "00");

    return `${year}.${month}.${day}.${hours}.${minutes}.${seconds}`;
};

export default ((req, res, next) => {
    const options = {
        branch: `/refs/heads/${req.params.branch}`,
        branchName: req.params.branch,
        owner: req.params.owner,
        reponame: req.params.reponame,
        rev: req.params.rev,
    };

    const releasePath = join(getSettings(req.app).releasepath, options.owner, options.reponame, options.branch, options.rev);

    readReport(releasePath, (err, report) => {
        if (err || !report) {
            return next(err);
        }

        const archive = createArchiver("zip");

        archive.on("error", next);
        res.attachment(`${options.reponame}.${getDatePart(report)}.${options.rev}.zip`);
        archive.pipe(res);
        archive.directory(releasePath, false);

        return archive.finalize();
    });
}) as express.RequestHandler;
