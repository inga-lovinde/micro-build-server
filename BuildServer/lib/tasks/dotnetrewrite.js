"use strict";

const path = require("path");
const fs = require("fs");
const async = require("async");
const glob = require("glob");
const settings = require("../../settings");

const processAssemblyInfo = (params, processor, appendInformationalVersion) => (originalContent, cb) => {
    let content = originalContent;

    if (!params.skipCodeSigning && !settings.skipCodeSigning) {
        content = content.replace(
            /InternalsVisibleTo\s*\(\s*"([\w.]+)"\s*\)/g,
            (match, p1) => `InternalsVisibleTo("${p1},PublicKey=${settings.codeSigningPublicKey}")`
        );
    }

    if (appendInformationalVersion) {
        content = `${content}\n[assembly: System.Reflection.AssemblyInformationalVersion("${processor.context.versionInfo}")]\n`;
    }

    return cb(null, content);
};

module.exports = (params, processor) => ({
    "process": () => {
        if (processor.context.dotnetrewriterDone) {
            return processor.done();
        }

        processor.context.dotnetrewriterDone = true;

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
