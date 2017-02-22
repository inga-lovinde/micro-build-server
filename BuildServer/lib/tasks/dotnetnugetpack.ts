"use strict";

import _ = require("underscore");
import dotnetnugetprocessinternal = require("./dotnetnugetprocessinternal");

export = (params, processor) => dotnetnugetprocessinternal(_.extendOwn(params, {
    "getFinalTask": (nupkg) => ({
        "params": { "filename": nupkg },
        "type": "copy"
    })
}), processor);
