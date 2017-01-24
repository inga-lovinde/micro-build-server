"use strict";

const path = require("path");
const dotNetBuilderWrapper = require("./dotnetbuilderwrapper");

module.exports = (params, processor) => dotNetBuilderWrapper({
    "TestLibraryPath": path.join(processor.context.exported, params.assembly),
    "command": "nunit"
}, processor);
