"use strict";

import { readFileSync } from "fs";
import { render } from "mustache";
import { join } from "path";

import { GenericTask } from "../types";
import dotnetcompile from "./dotnetcompile";
import sequential from "./sequential";
import writefile from "./writefile";

interface IParameters {
    readonly configuration: string;
    readonly isCodeAnalysisUnsupported: boolean;
    readonly skipCodeAnalysis: boolean;
    readonly skipCodeSigning: boolean;
}

const msbuildTemplate = readFileSync(join(__dirname, "/dotnetpackwebapp.template.msbuild"), { encoding: "utf8" });
const deployTemplate = readFileSync(join(__dirname, "/dotnetpackwebapp.template.bat"), { encoding: "utf8" });
const versionTemplate = readFileSync(join(__dirname, "/dotnetpackwebapp.template.version.aspx"), { encoding: "utf8" });

export default ((params) => (processor) => sequential({
    tasks: [
        {
            name: "writemakepackage",
            task: writefile({
                data: render(msbuildTemplate, params),
                filename: "MakePackage.msbuild",
            }),
        },
        {
            name: "writedeploy",
            task: writefile({
                data: render(deployTemplate, params),
                filename: "Deploy.bat",
            }),
        },
        {
            name: "writeversion",
            task: writefile({
                data: render(versionTemplate, params),
                filename: "version.aspx",
            }),
        },
        {
            name: "compile",
            task: dotnetcompile({
                ...params,
                overrideOutputDirectory: processor.context.release,
                solution: "MakePackage.msbuild",
                target: "Package",
            }),
        },
    ],
})(processor)) as GenericTask<IParameters>;
