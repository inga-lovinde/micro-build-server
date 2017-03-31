"use strict";

import { exists, readFile } from "fs";
import { join } from "path";

import { loadReport } from "./report-processor";
import { Report, Settings } from "./types";

interface IOptionsWithBranchInfo {
    readonly branch: string;
    readonly branchName: string;
    readonly owner: string;
    readonly reponame: string;
}

interface IOptionsWithRevInfo {
    readonly owner: string;
    readonly reponame: string;
    readonly rev: string;
}

interface IOptionsComplete extends IOptionsWithBranchInfo, IOptionsWithRevInfo {
}

interface IGetReportOptions {
    readonly branch?: string;
    readonly branchName?: string;
    readonly owner: string;
    readonly reponame: string;
    readonly rev?: string;
}

interface IOptionsWithReport extends IOptionsComplete {
    readonly report: Report;
}

type Callback<ResultOptions> = (err: any, result?: ResultOptions) => void;

const addBranchInfo = (settings: Settings, options: IOptionsWithRevInfo, callback: Callback<IOptionsComplete>) => {
    const branchFile = join(settings.releasepath, options.owner, options.reponame, "$revs", `${options.rev}.branch`);

    exists(branchFile, (exists) => {
        if (!exists) {
            return callback("BranchFileNotFound");
        }

        return readFile(branchFile, (err, data) => {
            if (err) {
                return callback(err);
            }

            const branch = data.toString();
            const branchParts = branch.split("/");
            const branchName = branchParts[branchParts.length - 1];

            return callback(null, {
                ...options,
                branch,
                branchName,
            });
        });
    });
};

const addRevInfo = (settings: Settings, options: IOptionsWithBranchInfo, callback: Callback<IOptionsComplete>) => {
    const revFile = join(settings.releasepath, options.owner, options.reponame, options.branch, "latest.id");

    exists(revFile, (exists) => {
        if (!exists) {
            return callback("RevFileNotFound");
        }

        return readFile(revFile, (err, data) => {
            if (err) {
                return callback(err);
            }

            const rev = data.toString();

            return callback(null, {
                ...options,
                rev,
            });
        });
    });
};

const parseOptions = (settings: Settings, options: IGetReportOptions, callback: Callback<IOptionsComplete>) => {
    if (options.rev && !(/^[\da-f]{40}$/i).test(options.rev)) {
        return callback(`Wrong rev format: ${options.rev}`);
    }

    const result = {
        owner: options.owner,
        reponame: options.reponame,
    };

    if (options.rev) {
        return addBranchInfo(settings, {
            ...result,
            rev: options.rev,
        }, callback);
    }

    if (options.branchName && /^[\da-f]{40}$/i.test(options.branchName)) {
        return addBranchInfo(settings, {
            ...result,
            rev: options.branchName,
        }, callback);
    }

    const branchName = options.branchName || "master";

    return addRevInfo(settings, {
        ...result,
        branch: `refs/heads/${branchName}`,
        branchName,
    }, callback);
};

export const getReport = (settings: Settings, options: IGetReportOptions, callback: Callback<IOptionsWithReport>) => parseOptions(settings, options, (err: string, result: IOptionsComplete) => {
    if (err) {
        return callback(err);
    }

    return loadReport(settings, result, callback);
});
