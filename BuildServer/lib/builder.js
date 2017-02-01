"use strict";

const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
const async = require("async");
const gitLoader = require("./git/loader");
const processor = require("./task-processor");
const reportProcessor = require("./report-processor");
const mailSender = require("./mail-sender");
const settings = require("../settings");

const codePostfix = "";

const notifyStatus = (options, callback) => {
    const status = {
        "description": String(options.description || "").substr(0, 140),
        "owner": options.owner,
        "repo": options.reponame,
        "sha": options.hash,
        "state": options.state,
        "target_url": `${settings.siteRoot}status/${options.owner}/${options.reponame}/${options.hash}`
    };

    settings.createGithub(options.owner).repos.createStatus(status, (err) => {
        if (err) {
            console.log(`Error while creating status: ${err}`);
            console.log(status);

            return callback(err);
        }

        return callback();
    });
};

const build = (options, callback) => {
    const url = options.url;
    const owner = options.owner;
    const reponame = options.reponame;
    const rev = options.rev;
    const branch = options.branch;
    const skipGitLoader = options.skipGitLoader;
    const local = path.join(options.app.get("gitpath"), "r");
    const tmp = path.join(options.app.get("tmpcodepath"), rev.substr(0, 15));
    const exported = tmp + codePostfix;
    const release = path.join(options.app.get("releasepath"), owner, reponame, branch, rev);
    const statusQueue = async.queue((task, callback) => task(callback), 1);
    const actualGitLoader = skipGitLoader
        ? (options, callback) => process.nextTick(callback)
        : gitLoader;
    const date = new Date();
    const versionMajor = date.getFullYear();
    const versionMinor = date.getMonth() + 1;
    const versionBuild = date.getDate();
    const versionRev = (date.getHours() * 100) + date.getMinutes();
    const version = `${versionMajor}.${versionMinor}.${versionBuild}.${versionRev}`;
    const versionInfo = `${version}; built from ${rev}; repository: ${owner}/${reponame}; branch: ${branch}`;

    statusQueue.push((callback) => notifyStatus({
        "description": "Preparing to build...",
        "hash": rev,
        owner,
        reponame,
        "state": "pending"
    }, callback));

    fse.mkdirsSync(release);

    fs.writeFileSync(path.join(options.app.get("releasepath"), owner, reponame, branch, "latest.id"), rev);
    fse.mkdirsSync(path.join(options.app.get("releasepath"), owner, reponame, "$revs"));
    fs.writeFileSync(path.join(options.app.get("releasepath"), owner, reponame, "$revs", `${rev}.branch`), branch);

    const done = (err, result) => {
        const errorMessage = result && result.errors
            ? ((result.errors.$allMessages || [])[0] || {}).message
            : err;
        const warnMessage = result && result.warns
            ? ((result.warns.$allMessages || [])[0] || {}).message
            : err;
        const infoMessage = result && result.infos
            ? ((result.infos.$allMessages || []).slice(-1)[0] || {}).message
            : err;

        reportProcessor.writeReport(release, err, result, (writeErr) => {
            statusQueue.push((callback) => async.parallel([
                (callback) => notifyStatus({
                    "description": errorMessage || warnMessage || infoMessage || "Success",
                    "hash": rev,
                    owner,
                    reponame,
                    "state": err
                        ? "error"
                        : "success"
                }, callback),
                (callback) => mailSender.send({
                    "from": settings.smtp.sender,
                    "headers": { "X-Laziness-level": 1000 },
                    "subject": `${err ? "Build failed for" : "Successfully built"} ${owner}/${reponame}/${branch}`,
                    "text": `Build status URL: ${settings.siteRoot}status/${owner}/${reponame}/${rev}\r\n\r\n`
                        + (
                            err
                                ? `Error message: ${err}\r\n\r\n`
                                : "")
                        + (
                            (!result || !result.messages || !result.messages.$allMessages)
                                ? JSON.stringify(result, null, 4)
                                : result.messages.$allMessages.map((msg) => `${msg.prefix}\t${msg.message}`).join("\r\n")),
                    "to": settings.smtp.receiver
                }, callback),
                (callback) => {
                    if (err) {
                        return process.nextTick(callback);
                    }

                    return fse.remove(tmp, callback);
                }
            ], callback));

            if (writeErr) {
                return callback(writeErr);
            }

            return callback(err, result);
        });
    };

    actualGitLoader({
        branch,
        exported,
        "hash": rev,
        local,
        "remote": `${url}.git`
    }, (err) => {
        if (err) {
            console.log(err);

            return done(`Git fetch error: ${err}`);
        }

        console.log("Done loading from git");

        return fs.exists(path.join(exported, "mbs.json"), (exists) => {
            if (!exists) {
                return done(null, "MBSNotFound");
            }

            return fs.readFile(path.join(exported, "mbs.json"), (err, data) => {
                if (err) {
                    return done(err, "MBSUnableToRead");
                }

                let task = null;

                try {
                    task = JSON.parse(data);
                } catch (ex) {
                    console.log(`Malformed data: ${data}`);

                    return done(ex, "MBSMalformed");
                }

                return processor.processTask(task, {
                    branch,
                    exported,
                    owner,
                    release,
                    reponame,
                    rev,
                    tmp,
                    versionInfo
                }, (err, result) => {
                    if (err) {
                        return done(err, result);
                    }

                    return done(err, result);
                });
            });
        });
    });
};

exports.build = build;
