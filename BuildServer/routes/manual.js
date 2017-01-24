"use strict";

const builder = require("../lib/builder");

exports.get = (req, res) => res.render("manual");

exports.post = (req, res) => {
    const options = req.body;

    options.url = `https://pos-github.payonline.ru/${options.owner}/${options.reponame}`;
    options.app = req.app;

    builder.build(options, (err, result) => {
        console.log("Done processing manual request");
        console.log(`Error: ${err}`);
        res.render("manual-done", {
            err,
            result
        });
    });
};
