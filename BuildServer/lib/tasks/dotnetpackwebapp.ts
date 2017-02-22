"use strict";

import path = require("path");
import fs = require("fs");
import Mustache = require("mustache");
import sequential = require("./sequential");

// eslint-disable-next-line no-sync
const msbuildTemplate = fs.readFileSync(path.join(__dirname, "/dotnetpackwebapp.template.msbuild"), { "encoding": "utf8" });
// eslint-disable-next-line no-sync
const deployTemplate = fs.readFileSync(path.join(__dirname, "/dotnetpackwebapp.template.bat"), { "encoding": "utf8" });
// eslint-disable-next-line no-sync
const versionTemplate = fs.readFileSync(path.join(__dirname, "/dotnetpackwebapp.template.version.aspx"), { "encoding": "utf8" });

export = (params, processor) => sequential({
    "tasks": [
        {
            "params": {
                "data": Mustache.render(msbuildTemplate, params),
                "filename": "MakePackage.msbuild"
            },
            "type": "writefile"
        },
        {
            "params": {
                "data": Mustache.render(deployTemplate, params),
                "filename": "Deploy.bat"
            },
            "type": "writefile"
        },
        {
            "params": {
                "data": Mustache.render(versionTemplate, params),
                "filename": "version.aspx"
            },
            "type": "writefile"
        },
        {
            "params": {
                "configuration": params.configuration,
                "isCodeAnalysisUnsupported": params.isCodeAnalysisUnsupported,
                "overrideOutputDirectory": processor.context.release,
                "skipCodeSigning": params.skipCodeSigning,
                "solution": "MakePackage.msbuild",
                "target": "Package"
            },
            "type": "dotnetcompile"
        }
    ]
}, processor);
