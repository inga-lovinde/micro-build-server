"use strict";

import { create as createArchiver } from "archiver";
import { join } from "path";

import { readReport } from "../lib/report-processor";

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

export default (req, res, next) => {
    const options = {
        branch: `/refs/heads/${req.params.branch}`,
        branchName: req.params.branch,
        owner: req.params.owner,
        reponame: req.params.reponame,
        rev: req.params.rev,
    };

    const releasePath = join(req.app.get("releasepath"), options.owner, options.reponame, options.branch, options.rev);

    readReport(releasePath, (err, report) => {
        if (err) {
            return next(err);
        }

        const archive = createArchiver("zip");

        archive.on("error", next);
        res.attachment(`${options.reponame}.${getDatePart(report)}.${options.rev}.zip`, ".");
        archive.pipe(res);
        archive.directory(releasePath, false);

        return archive.finalize();
    });
};