"use strict";

import path = require("path");
import fs = require("fs");
import async = require("async");
import glob = require("glob");
import settings = require("../../settings");

const flagDoneName = "dotnetrewriterDone";

const processAssemblyInfo = (params, processor, appendInformationalVersion) => (originalContent, cb) => {
    const processInternalsVisible = (content) => {
        if (params.skipCodeSigning || settings.skipCodeSigning) {
            return content;
        }

        return content.replace(
            /InternalsVisibleTo\s*\(\s*"([\w.]+)"\s*\)/g,
            (match, p1) => `InternalsVisibleTo("${p1},PublicKey=${settings.codeSigningPublicKey}")`
        );
    };

    const processInformationalVersion = (content) => {
        if (!appendInformationalVersion) {
            return content;
        }

        return `${content}\n[assembly: System.Reflection.AssemblyInformationalVersion("${processor.context.versionInfo}")]\n`;
    };

    return cb(null, processInformationalVersion(processInternalsVisible(originalContent)));
};

export = (params, processor) => ({
    "process": () => {
        if (processor.context.containsFlag(flagDoneName)) {
            return processor.done();
        }

        processor.context.addFlag(flagDoneName);

        return glob("**/{InternalsVisible,AssemblyInfo}*.cs", { "cwd": processor.context.exported }, (globErr, files) => {
            if (globErr) {
                processor.onError(globErr);

                return processor.done();
            }

            processor.onInfo(`Found ${files.length} AssemblyInfo.cs files`);

            if (!files || !files.length) {
                processor.onWarn("No AssemblyInfo.cs found");

                return processor.done();
            }

            return async.parallel(files.map((file) => (callback) => async.waterfall([
                fs.readFile.bind(null, path.join(processor.context.exported, file), { "encoding": "utf8" }),
                processAssemblyInfo(params, processor, file.toLowerCase().includes("assemblyinfo.cs")),
                fs.writeFile.bind(null, path.join(processor.context.exported, file))
            ], (err) => {
                if (err) {
                    processor.onError(`Unable to rewrite file ${file}: ${err}`);
                } else {
                    processor.onInfo(`Rewritten file ${file}`);
                }
                callback(err);
            })), processor.done.bind(processor));
        });
    }
});
