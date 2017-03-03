"use strict";

import * as _ from "underscore";
import { build } from "../builder";
import { getSettings } from "../settings-wrapper";

export const get = (req, res) => res.render("manual");

export const post = (req, res) => {
    const settings = getSettings(req.app);

    const options = {
        ...req.body,
        url: `https://pos-github.payonline.ru/${req.body.owner}/${req.body.reponame}`,
    };

    build(settings, options, (err, result) => {
        console.log("Done processing manual request");
        console.log(`Error: ${err}`);
        res.render("manual-done", {
            err,
            result,
        });
    });
};
