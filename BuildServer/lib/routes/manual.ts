"use strict";

import * as express from "express";

import { build } from "../builder";
import { getSettings } from "../settings-wrapper";
import { ReportResult } from "../types";

export const get: express.RequestHandler = (_req, res) => res.render("manual");

export const post: express.RequestHandler = (req, res) => {
    const settings = getSettings(req.app);

    const options = {
        ...req.body,
        url: `https://pos-github.payonline.ru/${req.body.owner}/${req.body.reponame}`,
    };

    build(settings, options, (err: string, result: ReportResult) => {
        console.log("Done processing manual request");
        console.log(`Error: ${err}`);
        res.render("manual-done", {
            err,
            result,
        });
    });
};
