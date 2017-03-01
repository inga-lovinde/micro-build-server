"use strict";

import { readFileSync } from "fs";
import { render } from "mustache";
import { join } from "path";

import { Task } from "../../types";
import sequential from "./sequential";

const msbuildTemplate = readFileSync(join(__dirname, "/dotnetpackwebapp.template.msbuild"), { encoding: "utf8" });
const deployTemplate = readFileSync(join(__dirname, "/dotnetpackwebapp.template.bat"), { encoding: "utf8" });
const versionTemplate = readFileSync(join(__dirname, "/dotnetpackwebapp.template.version.aspx"), { encoding: "utf8" });

export default ((params, processor) => sequential({
    tasks: [
        {
            params: {
                data: render(msbuildTemplate, params),
                filename: "MakePackage.msbuild",
            },
            type: "writefile",
        },
        {
            params: {
                data: render(deployTemplate, params),
                filename: "Deploy.bat",
            },
            type: "writefile",
        },
        {
            params: {
                data: render(versionTemplate, params),
                filename: "version.aspx",
            },
            type: "writefile",
        },
        {
            params: {
                configuration: params.configuration,
                isCodeAnalysisUnsupported: params.isCodeAnalysisUnsupported,
                overrideOutputDirectory: processor.context.release,
                skipCodeSigning: params.skipCodeSigning,
                solution: "MakePackage.msbuild",
                target: "Package",
            },
            type: "dotnetcompile",
        },
    ],
}, processor)) as Task;
