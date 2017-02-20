"use strict";

const path = require("path");
const fs = require("fs");
const _ = require("underscore");
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

            const branch = data.toString();
            const branchParts = branch.split("/");
            const branchName = branchParts[branchParts.length - 1];

            return callback(null, _.extend(options, {
                branch,
                branchName
            }));
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

            const rev = data.toString();

            return callback(null, _.extend(options, { rev }));
        });
    });
};

const parseOptions = (app, options, callback) => {
    if (options.rev && !(/^[\da-f]{40}$/i).test(options.rev)) {
        return callback(`Wrong rev format: ${options.rev}`, options);
    }

    const result = {
        "owner": options.owner,
        "reponame": options.reponame
    };

    if (options.rev) {
        return addBranchInfo(app, _.extend(result, { "rev": options.rev }), callback);
    }

    if (/^[\da-f]{40}$/i.test(options.branchName)) {
        return addBranchInfo(app, _.extend(result, { "rev": options.branchName }), callback);
    }

    const branchName = options.branchName || "master";

    return addRevInfo(app, _.extend(result, {
        "branch": `refs/heads/${branchName}`,
        branchName
    }), callback);
};

exports.getReport = (app, options, callback) => parseOptions(app, options, (err, result) => {
    if (err) {
        return callback(err, {});
    }

    return reportProcessor.loadReport(app, result, callback);
});
