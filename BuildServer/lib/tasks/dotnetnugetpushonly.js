"use strict";

const path = require("path");
const dotnetbuilderwrapper = require("./dotnetbuilderwrapper");
const settings = require("../../settings");

module.exports = (params, processor) => dotnetbuilderwrapper({
    "ApiKey": settings.nugetApiKey,
    "NugetHost": settings.nugetHost,
    "Package": path.join(processor.context.exported, params.Package),
    "command": "nugetpush"
}, processor);
