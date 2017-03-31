"use strict";

import * as express from "express";
import * as JSONParse from "json-parse-safe";

import { build } from "../builder";
import { commentOnPullRequest } from "../commenter";
import { getSettings } from "../settings-wrapper";
import { HookParameters, HookPullRequestPayload, HookPushPayload } from "../types";

interface IBaseRepoOptions {
    branch: string;
    branchName?: string;
    owner: string;
    reponame: string;
}

const getBranchDescription = (options: IBaseRepoOptions) => `${options.owner}/${options.reponame}:${options.branchName || options.branch}`;

const processPush = (req: express.Request, res: express.Response, payload: HookPushPayload) => {
    const settings = getSettings(req.app);
    const repository = payload.repository;
    const options = {
        branch: payload.ref,
        owner: repository.owner.name,
        reponame: repository.name,
        rev: payload.after,
        url: repository.url,
    };

    console.log(`Got push event for ${getBranchDescription(options)}`);

    build(settings, options, (err, result) => {
        console.log("Done processing request from GitHub");
        console.log(`Error: ${err}`);
        res.send(`Done processing request from GitHub\r\nError: ${err}\r\nResult: ${result}`);
    });
};

const processPullRequest = (req: express.Request, res: express.Response, payload: HookPullRequestPayload) => {
    const action = payload.action;
    const pullRequestNumber = payload.number;
    const pullRequest = payload.pull_request;
    const head = pullRequest.head;
    const headRepo = head.repo;
    const headRepoOptions = {
        branch: `refs/heads/${head.ref}`,
        branchName: head.ref,
        owner: headRepo.owner.name || headRepo.owner.login,
        reponame: headRepo.name,
        rev: head.sha,
        url: headRepo.url,
    };
    const base = pullRequest.base;
    const baseRepo = base.repo;
    const baseRepoOptions = {
        branch: `refs/heads/${base.ref}`,
        branchName: base.ref,
        owner: baseRepo.owner.name || baseRepo.owner.login,
        reponame: baseRepo.name,
    };
    const settings = getSettings(req.app);
    const options = {
        action,
        baseRepoOptions,
        headRepoOptions,
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

    return commentOnPullRequest(settings, options, (err) => {
        if (err) {
            console.log(`Unable to post comment: ${err}`);
        }

        res.end();
    });
};

const getPayload = (body: any) => {
    if (!body.payload) {
        return body;
    }

    return JSONParse(body.payload).value;
};

const getParameters = (req: express.Request): HookParameters => ({
    eventType: req.header("x-github-event") as any,
    payload: getPayload(req.body),
});

export default ((req, res) => {
    if (!req.body || (!req.body.payload && !req.body.repository)) {
        return res.end();
    }

    const parameters = getParameters(req);

    if (parameters.eventType === "push") {
        return processPush(req, res, parameters.payload);
    }

    if (parameters.eventType === "pull_request") {
        return processPullRequest(req, res, parameters.payload);
    }

    console.log(`Got "${parameters.eventType}" event:`);

    return res.send("Only push/pull_request events are supported");
}) as express.RequestHandler;
