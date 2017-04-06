"use strict";

import { parallel, waterfall } from "async";
import { readFile, writeFile } from "fs";
import * as glob from "glob";
import { join } from "path";

import { GenericTask, TaskProcessor } from "../types";

interface IParameters {
    readonly skipCodeSigning?: boolean;
}

type Callback  = (err?: any, result?: string) => void;

const flagDoneName = "dotnetrewriterDone";

const processAssemblyInfo = (params: IParameters, processor: TaskProcessor, appendInformationalVersion: boolean) => (originalContent: string, cb: Callback) => {
    const processInternalsVisible = (content: string) => {
        if (processor.settings.skipCodeSigning || params.skipCodeSigning) {
            return content;
        }

        const publicKey = processor.settings.codeSigningPublicKey;
        const pattern = /InternalsVisibleTo\s*\(\s*"([\w.]+)"\s*\)/g;

        return content.replace(pattern, (_match, p1) => `InternalsVisibleTo("${p1},PublicKey=${publicKey}")`);
    };

    const processInformationalVersion = (content: string) => {
        if (!appendInformationalVersion) {
            return content;
        }

        return `${content}\n[assembly: System.Reflection.AssemblyInformationalVersion("${processor.context.versionInfo}")]\n`;
    };

    return cb(null, processInformationalVersion(processInternalsVisible(originalContent)));
};

export default ((params) => (processor) => () => {
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

        return parallel(files.map((file) => (callback: Callback) => waterfall([
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
}) as GenericTask<IParameters>;
