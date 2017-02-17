"use strict";

// Code taken from http://stackoverflow.com/a/17204293
// eslint-disable-next-line no-sync
require("fs").readdirSync(__dirname)
    .forEach((file) => {
        if (file.match(/\.js$/) !== null && file !== "index.js") {
            const name = file.replace(".js", "");

            // eslint-disable-next-line global-require
            exports[name] = require(`./${file}`);
        }
    });
