"use strict";

const _ = require("underscore");
const builder = require("../lib/builder");

exports.get = (req, res) => res.render("manual");

exports.post = (req, res) => {
    const options = _.extend(req.body, {
        "app": req.app,
        "url": `https://pos-github.payonline.ru/${req.body.owner}/${req.body.reponame}`
    });

    builder.build(options, (err, result) => {
        console.log("Done processing manual request");
        console.log(`Error: ${err}`);
        res.render("manual-done", {
            err,
            result
        });
    });
};
