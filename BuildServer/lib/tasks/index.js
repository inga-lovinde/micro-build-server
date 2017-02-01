"use strict";

// Code taken from http://stackoverflow.com/a/17204293
require("fs").readdirSync(__dirname).forEach((file) => {
    if (file.match(/\.js$/) !== null && file !== "index.js") {
        const name = file.replace(".js", "");

        exports[name] = require(`./${file}`);
    }
});
