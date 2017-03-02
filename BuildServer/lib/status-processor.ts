"use strict";

import { exists, readFile } from "fs";
import { join } from "path";
import * as _ from "underscore";

import { loadReport } from "./report-processor";

const addBranchInfo = (app, options, callback) => {
    const branchFile = join(app.get("releasepath"), options.owner, options.reponame, "$revs", `${options.rev}.branch`);

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

const addRevInfo = (app, options, callback) => {
    const revFile = join(app.get("releasepath"), options.owner, options.reponame, options.branch, "latest.id");

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

const parseOptions = (app, options, callback) => {
    if (options.rev && !(/^[\da-f]{40}$/i).test(options.rev)) {
        return callback(`Wrong rev format: ${options.rev}`, options);
    }

    const result = {
        owner: options.owner,
        reponame: options.reponame,
    };

    if (options.rev) {
        return addBranchInfo(app, {
            ...result,
            rev: options.rev,
        }, callback);
    }

    if (/^[\da-f]{40}$/i.test(options.branchName)) {
        return addBranchInfo(app, {
            ...result,
            rev: options.branchName,
        }, callback);
    }

    const branchName = options.branchName || "master";

    return addRevInfo(app, {
        ...result,
        branch: `refs/heads/${branchName}`,
        branchName,
    }, callback);
};

export const getReport = (app, options, callback) => parseOptions(app, options, (err, result) => {
    if (err) {
        return callback(err, {});
    }

    return loadReport(app, result, callback);
});
