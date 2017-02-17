"use strict";

const path = require("path");
const fs = require("fs");
const async = require("async");
const glob = require("glob");

const autoGeneratedMarker
    = "//------------------------------------------------------------------------------\n"
    + "// <auto-generated>";

module.exports = (params, processor) => ({
    "process": () => {
        if (processor.context.dotnetcheckerDone) {
            return processor.done();
        }

        processor.context.dotnetcheckerDone = true;

        return glob("**/*.cs", { "cwd": processor.context.exported }, (globErr, files) => {
            if (globErr) {
                processor.onError(globErr);

                return processor.done();
            }

            processor.onInfo(`Found ${files.length} .cs files`);

            if (!files || !files.length) {
                processor.onWarn("No .cs files found");

                return processor.done();
            }

            const processFile = (data, file) => {
                if (data.includes("\r\n")) {
                    return processor.onError(`Windows-style EOL (0D0A) found in file ${file}`);
                }

                if (!params.ignoreCodeStyle) {
                    if (data.substr(1, autoGeneratedMarker.length) === autoGeneratedMarker || data.startsWith(autoGeneratedMarker)) {
                        return processor.onInfo(`Skipping auto-generated file ${file}`);
                    }

                    if (data.includes("\t") && data.includes("    ")) {
                        processor.onError(`Both tabs and spaces found in file ${file}`);
                    }

                    if (data.includes("\t")) {
                        processor.onError(`Tabs found in file ${file}`);
                    }
                }

                return processor.onInfo(`Checked file ${file}`);
            };

            return async.parallel(files.map((file) => (callback) => fs.readFile(
                path.join(processor.context.exported, file),
                { "encoding": "utf8" },
                (readErr, data) => {
                    if (readErr) {
                        processor.onError(`Unable to check file ${file}: ${readErr}`);

                        return callback(readErr);
                    }

                    processFile(data, file);

                    return callback();
                }
            )), processor.done.bind(processor));
        });
    }
});
