"use strict";

import { exists, readFile } from "fs";
import { join } from "path";

import { loadReport } from "./report-processor";
import { Settings } from "./types";

const addBranchInfo = (settings: Settings, options, callback) => {
    const branchFile = join(settings.releasepath, options.owner, options.reponame, "$revs", `${options.rev}.branch`);

    exists(branchFile, (exists) => {
        if (!exists) {
            return callback("BranchFileNotFound", options);
        }

        return readFile(branchFile, (err, data) => {
            if (err) {
                return callback(err, options);
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

const addRevInfo = (settings: Settings, options, callback) => {
    const revFile = join(settings.releasepath, options.owner, options.reponame, options.branch, "latest.id");

    exists(revFile, (exists) => {
        if (!exists) {
            return callback("RevFileNotFound", options);
        }

        return readFile(revFile, (err, data) => {
            if (err) {
                return callback(err, options);
            }

            const rev = data.toString();

            return callback(null, {
                ...options,
                rev,
            });
        });
    });
};

const parseOptions = (settings: Settings, options, callback) => {
    if (options.rev && !(/^[\da-f]{40}$/i).test(options.rev)) {
        return callback(`Wrong rev format: ${options.rev}`, options);
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

    if (/^[\da-f]{40}$/i.test(options.branchName)) {
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

export const getReport = (settings: Settings, options, callback) => parseOptions(settings, options, (err, result) => {
    if (err) {
        return callback(err, {});
    }

    return loadReport(settings, result, callback);
});
