"use strict";

const path = require("path");
const fs = require("fs");

const reportProcessor = require("./report-processor");

const addBranchInfo = (app, options, callback) => {
    const branchFile = path.join(app.get("releasepath"), options.owner, options.reponame, "$revs", `${options.rev}.branch`);

    fs.exists(branchFile, (exists) => {
        if (!exists) {
            return callback("BranchFileNotFound", options);
        }

        return fs.readFile(branchFile, (err, data) => {
            if (err) {
                return callback(err, options);
            }
            options.branch = data.toString();
            options.branchName = options.branch.split("/").pop();

            return callback(null, options);
        });
    });
};

const addRevInfo = (app, options, callback) => {
    const revFile = path.join(app.get("releasepath"), options.owner, options.reponame, options.branch, "latest.id");

    fs.exists(revFile, (exists) => {
        if (!exists) {
            return callback("RevFileNotFound", options);
        }

        return fs.readFile(revFile, (err, data) => {
            if (err) {
                return callback(err, options);
            }
            options.rev = data.toString();

            return callback(null, options);
        });
    });
};

const parseOptions = (app, options, callback) => {
    const result = {
        "owner": options.owner,
        "reponame": options.reponame
    };

    if (options.rev && !(/^[\da-f]{40}$/i).test(options.rev)) {
        return callback(`Wrong rev format: ${options.rev}`, options);
    }

    if (options.rev) {
        result.rev = options.rev;

        return addBranchInfo(app, result, callback);
    }

    if (/^[\da-f]{40}$/i.test(options.branchName)) {
        result.rev = options.branchName;

        return addBranchInfo(app, result, callback);
    }

    result.branchName = options.branchName || "master";
    result.branch = `refs/heads/${result.branchName}`;

    return addRevInfo(app, result, callback);
};

exports.getReport = (app, options, callback) => parseOptions(app, options, (err, result) => {
    if (err) {
        return callback(err, {});
    }

    return reportProcessor.loadReport(app, result, callback);
});
