"use strict";

let tasks = {};

// Code taken from http://stackoverflow.com/a/17204293
// eslint-disable-next-line no-sync
require("fs").readdirSync(__dirname)
    .forEach((file) => {
        if (file.match(/\.ts$/) !== null && file !== "index.ts") {
            const name = file.replace(".ts", "");

            // eslint-disable-next-line global-require
            tasks[name] = require(`./${file}`).default;
        }
    });

export default tasks;
