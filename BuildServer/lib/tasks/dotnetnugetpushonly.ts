"use strict";

import path = require("path");
import dotnetbuilderwrapper = require("./dotnetbuilderwrapper");
import settings = require("../../settings");

export = (params, processor) => dotnetbuilderwrapper({
    "ApiKey": settings.nugetApiKey,
    "NugetHost": settings.nugetHost,
    "Package": path.join(processor.context.exported, params.Package),
    "command": "nugetpush"
}, processor);
