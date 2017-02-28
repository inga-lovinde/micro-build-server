"use strict";

import { create as createArchiver } from "archiver";
import { createWriteStream } from "fs";
import { join, normalize } from "path";

export default ((params, processor) => ({
    process: () => {
        const sourceDirectoryPath = normalize(join(processor.context.exported, String(params.directory || "")));
        const targetArchivePath = normalize(join(processor.context.release, params.archive));

        processor.onInfo(`Compressing "${params.directory}" to "${params.archive}"`);

        const output = createWriteStream(targetArchivePath);
        const archive = createArchiver("zip");

        output.on("close", () => processor.done());

        archive.on("error", (err) => processor.onError(`Error while compressing: ${err}`));
        archive.pipe(output);
        archive.directory(sourceDirectoryPath, false);
        archive.finalize();
    },
})) as Task;
