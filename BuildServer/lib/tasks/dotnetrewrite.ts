"use strict";

import { parallel, waterfall } from "async";
import { readFile, writeFile } from "fs";
import * as glob from "glob";
import { join } from "path";

import settings from "../../settings";
import { Task } from "../../types";

const flagDoneName = "dotnetrewriterDone";

const processAssemblyInfo = (params, processor, appendInformationalVersion) => (originalContent, cb) => {
    const processInternalsVisible = (content) => {
        if (params.skipCodeSigning || settings.skipCodeSigning) {
            return content;
        }

        const pattern = /InternalsVisibleTo\s*\(\s*"([\w.]+)"\s*\)/g;
        const replacer = (match, p1) => `InternalsVisibleTo("${p1},PublicKey=${settings.codeSigningPublicKey}")`;

        return content.replace(pattern, replacer);
    };

    const processInformationalVersion = (content) => {
        if (!appendInformationalVersion) {
            return content;
        }

        return `${content}\n[assembly: System.Reflection.AssemblyInformationalVersion("${processor.context.versionInfo}")]\n`;
    };

    return cb(null, processInformationalVersion(processInternalsVisible(originalContent)));
};

export default ((params, processor) => () => {
    if (processor.context.containsFlag(flagDoneName)) {
        return processor.done();
    }

    processor.context.addFlag(flagDoneName);

    return glob("**/{InternalsVisible,AssemblyInfo}*.cs", { cwd: processor.context.exported }, (globErr, files) => {
        if (globErr) {
            processor.onError(globErr);

            return processor.done();
        }

        processor.onInfo(`Found ${files.length} AssemblyInfo.cs files`);

        if (!files || !files.length) {
            processor.onWarn("No AssemblyInfo.cs found");

            return processor.done();
        }

        return parallel(files.map((file) => (callback) => waterfall([
            readFile.bind(null, join(processor.context.exported, file), { encoding: "utf8" }),
            processAssemblyInfo(params, processor, file.toLowerCase().includes("assemblyinfo.cs")),
            writeFile.bind(null, join(processor.context.exported, file)),
        ], (err) => {
            if (err) {
                processor.onError(`Unable to rewrite file ${file}: ${err}`);
            } else {
                processor.onInfo(`Rewritten file ${file}`);
            }
            callback(err);
        })), processor.done);
    });
}) as Task;
