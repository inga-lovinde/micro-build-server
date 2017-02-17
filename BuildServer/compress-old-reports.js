"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const glob = require("glob");
const async = require("async");
const settings = require("./settings");

const streamsNumber = 100;

glob("**\\report.json", { "cwd": settings.releasepath }, (globErr, files) => {
    if (globErr) {
        return console.log(globErr);
    }

    return async.parallelLimit(files.map((file) => (callback) => {
        const originalPath = path.join(settings.releasepath, file);
        const newPath = `${originalPath}.gz`;

        console.log(file);
        fs.createReadStream(originalPath)
            .pipe(zlib.createGzip())
            .pipe(fs.createWriteStream(newPath))
            .on("error", callback)
            .on("finish", () => {
                fs.unlink(originalPath, callback);
            });
    }), streamsNumber, (err) => {
        if (err) {
            console.log(err);
        }

        console.log("Done");
    });
});
