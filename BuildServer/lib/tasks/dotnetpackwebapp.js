"use strict";

const fs = require('fs');
const Mustache = require('mustache');

const sequential = require('./sequential');

const msbuildTemplate = fs.readFileSync(__dirname + "/dotnetpackwebapp.template.msbuild", {encoding: "utf8"});
const deployTemplate = fs.readFileSync(__dirname + "/dotnetpackwebapp.template.bat", {encoding: "utf8"});
const versionTemplate = fs.readFileSync(__dirname + "/dotnetpackwebapp.template.version.aspx", {encoding: "utf8"});

module.exports = (params, processor) => sequential({
    tasks: [
        {
            type: "writefile",
            params: {
                filename: "MakePackage.msbuild",
                data: Mustache.render(msbuildTemplate, params)
            }
        },
        {
            type: "writefile",
            params: {
                filename: "Deploy.bat",
                data: Mustache.render(deployTemplate, params)
            }
        },
        {
            type: "writefile",
            params: {
                filename: "version.aspx",
                data: Mustache.render(versionTemplate, params)
            }
        },
        {
            type: "dotnetcompile",
            params: {
                solution: "MakePackage.msbuild",
                skipCodeSigning: params.skipCodeSigning,
                isCodeAnalysisUnsupported: params.isCodeAnalysisUnsupported,
                configuration: params.configuration,
                target: "Package",
                overrideOutputDirectory: processor.context.release
            }
        }
    ]
}, processor);
