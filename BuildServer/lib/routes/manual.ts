"use strict";

import * as _ from "underscore";
import { build } from "../builder";

export const get = (req, res) => res.render("manual");

export const post = (req, res) => {
    const options = {
        ...req.body,
        app: req.app,
        url: `https://pos-github.payonline.ru/${req.body.owner}/${req.body.reponame}`,
    };

    build(options, (err, result) => {
        console.log("Done processing manual request");
        console.log(`Error: ${err}`);
        res.render("manual-done", {
            err,
            result,
        });
    });
};
