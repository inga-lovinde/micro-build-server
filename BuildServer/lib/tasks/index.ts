"use strict";

import { readdirSync } from "fs";

const tasks = {};

// Code taken from http://stackoverflow.com/a/17204293
readdirSync(__dirname)
    .forEach((file) => {
        if (file.match(/\.ts$/) !== null && file !== "index.ts") {
            const name = file.replace(".ts", "");
            tasks[name] = require(`./${file}`).default;
        }
    });

export default tasks as Tasks;
