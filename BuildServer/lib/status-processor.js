"use strict";

const fs = require('fs');
const glob = require('glob');

const addBranchInfo = (app, options, callback) => {
    const branchFile = app.get('releasepath') + "/" + options.owner + "/" + options.reponame + "/$revs/" + options.rev + ".branch";
    fs.exists(branchFile, (exists) => {
        if (!exists) {
            return callback("BranchFileNotFound", options);
        }
        fs.readFile(branchFile, (err, data) => {
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
    const revFile = app.get('releasepath') + "/" + options.owner + "/" + options.reponame + "/" + options.branch + "/latest.id";
    fs.exists(revFile, (exists) => {
        if (!exists) {
            return callback("RevFileNotFound", options);
        }
        fs.readFile(revFile, (err, data) => {
            if (err) {
                return callback(err, options);
            }
            options.rev = data.toString();
            return callback(null, options);
        });
    });
};

const parseOptions = (app, options, callback) => {
    const result = {};

    result.owner = options.owner;
    result.reponame = options.reponame;

    if (options.rev && !(/^[\da-f]{40}$/i).test(options.rev)) {
        return callback("Wrong rev format: " + options.rev, options);
    }

    if (options.rev) {
        result.rev = options.rev;
        return addBranchInfo(app, result, callback);
    } else if (/^[\da-f]{40}$/i.test(options.branchName)) {
        result.rev = options.branchName;
        return addBranchInfo(app, result, callback);
    } else {
        result.branchName = options.branchName || "master";
        result.branch = "refs/heads/" + result.branchName;
        return addRevInfo(app, result, callback);
    }
};

const loadReport = (app, options, callback) => {
    const releaseDir = app.get('releasepath') + "/" + options.owner + "/" + options.reponame + "/" + options.branch + "/" + options.rev;

    glob("**", {cwd: releaseDir, mark: true}, (err, files) => {
        if (err) {
            return callback(err, options);
        }

        const reportFile = releaseDir + "/report.json";
        options.files = files;
        fs.exists(reportFile, (exists) => {
            if (!exists) {
                return callback("ReportFileNotFound", options);
            }

            fs.readFile(reportFile, (err, dataBuffer) => {
                if (err) {
                    return callback(err, options);
                }
                const data = dataBuffer.toString();
                if (!data) {
                    return callback("ReportFileNotFound", options);
                }
                options.report = JSON.parse(data);
                return callback(null, options);
            });
        });
    });
};

exports.getReport = (app, options, callback) => parseOptions(app, options, (err, result) => {
    if (err) {
        return callback(err, {});
    }

    return loadReport(app, result, callback);
});
