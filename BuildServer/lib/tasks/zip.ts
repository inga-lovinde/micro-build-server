"use strict";

import fs = require("fs");
import path = require("path");
import Archiver = require("archiver");

export = (params, processor) => ({
    "process": () => {
        const sourceDirectoryPath = path.normalize(path.join(processor.context.exported, String(params.directory || "")));
        const targetArchivePath = path.normalize(path.join(processor.context.release, params.archive));

        processor.onInfo(`Compressing "${params.directory}" to "${params.archive}"`);

        const output = fs.createWriteStream(targetArchivePath);
        const archive = new Archiver("zip");

        output.on("close", () => processor.done());

        archive.on("error", (err) => processor.onError(`Error while compressing: ${err}`));
        archive.pipe(output);
        archive.directory(sourceDirectoryPath, false);
        archive.finalize();
    }
});
