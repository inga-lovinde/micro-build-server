"use strict";

import * as JSONParse from "json-parse-safe";
import { build } from "../lib/builder";
import { commentOnPullRequest } from "../lib/commenter";

const getBranchDescription = (options) => `${options.owner}/${options.reponame}:${options.branchname || options.branch}`;

const processPush = (req, res, payload) => {
    const repository = payload.repository;
    const options = {
        app: req.app,
        branch: payload.ref,
        owner: repository.owner.name,
        reponame: repository.name,
        rev: payload.after,
        url: repository.url,
    };

    console.log(`Got push event for ${getBranchDescription(options)}`);

    build(options, (err, result) => {
        console.log("Done processing request from GitHub");
        console.log(`Error: ${err}`);
        res.send(`Done processing request from GitHub\r\nError: ${err}\r\nResult: ${result}`);
    });
};

const processPullRequest = (req, res, payload) => {
    const action = payload.action;
    const pullRequestNumber = payload.number;
    const pullRequest = payload.pull_request;
    const head = pullRequest.head;
    const headRepo = head.repo;
    const headRepoOptions = {
        branch: `refs/heads/${head.ref}`,
        branchname: head.ref,
        owner: headRepo.owner.name || headRepo.owner.login,
        reponame: headRepo.name,
        rev: head.sha,
        url: headRepo.url,
    };
    const base = pullRequest.base;
    const baseRepo = base.repo;
    const baseRepoOptions = {
        branchname: base.ref,
        owner: baseRepo.owner.name || baseRepo.owner.login,
        reponame: baseRepo.name,
    };
    const options = {
        action,
        app: req.app,
        baseRepoOptions,
        headRepoOptions,
        pullRequestNumber,
    };
    const masterOptions = {
        action,
        app: req.app,
        baseRepoOptions,
        headRepoOptions: baseRepoOptions,
        pullRequestNumber,
    };

    console.log(`Got pull request ${action} event, `
        + `from ${getBranchDescription(headRepoOptions)} (${headRepoOptions.rev}) to ${getBranchDescription(baseRepoOptions)}`);

    if (action !== "opened" && action !== "reopened" && action !== "synchronize" && action !== "closed") {
        return res.send("Only opened/reopened/synchronize/closed actions are supported");
    }

    if (action === "closed" && !pullRequest.merged) {
        console.log("Pull request closed without merging");

        return res.send("Pull request closed without merging");
    }

    if (action === "closed") {
        return res.send("");
    }

    return commentOnPullRequest((action === "closed" && masterOptions) || options, (err, data) => {
        if (err) {
            console.log(`Unable to post comment: ${err}`);
        }

        res.send(err || data);
    });
};

const getPayload = (body) => {
    if (!body.payload) {
        return body;
    }

    return JSONParse(body.payload).value;
};

export default (req, res) => {
    if (!req.body || (!req.body.payload && !req.body.repository)) {
        return res.end();
    }

    const eventType = req.header("x-github-event");
    const payload = getPayload(req.body);

    if (eventType === "push") {
        return processPush(req, res, payload);
    }

    if (eventType === "pull_request") {
        return processPullRequest(req, res, payload);
    }

    console.log(`Got "${eventType}" event:`);

    return res.send("Only push/pull_request events are supported");
};
