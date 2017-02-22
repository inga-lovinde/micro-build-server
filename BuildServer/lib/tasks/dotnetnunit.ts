"use strict";

import path = require("path");
import dotNetBuilderWrapper = require("./dotnetbuilderwrapper");

export = (params, processor) => dotNetBuilderWrapper({
    "TestLibraryPath": path.join(processor.context.exported, params.assembly),
    "command": "nunit"
}, processor);
