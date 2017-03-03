"use strict";

import * as express from "express";

import { getSettings } from "../settings-wrapper";

export default ((req, res) => {
    const options = {
        branch: `/refs/heads/${req.params.branch}`,
        branchName: req.params.branch,
        file: req.params[0],
        owner: req.params.owner,
        reponame: req.params.reponame,
        rev: req.params.rev,
    };

    const settings = getSettings(req.app);

    const pathParts = [settings.releasepath, options.owner, options.reponame, options.branch, options.rev, options.file];

    res.sendfile(pathParts.join("/"));
}) as express.RequestHandler;
