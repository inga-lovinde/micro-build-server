"use strict";

const _ = require("underscore");
const dotnetnugetprocessinternal = require("./dotnetnugetprocessinternal");

module.exports = (params, processor) => dotnetnugetprocessinternal(_.extendOwn(params, {
    "getFinalTask": (nupkg) => ({
        "params": { "filename": nupkg },
        "type": "copy"
    })
}), processor);
