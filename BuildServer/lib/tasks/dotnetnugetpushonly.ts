"use strict";

import { join } from "path";
import dotnetbuilderwrapper from "./dotnetbuilderwrapper";
import settings from "../../settings";

export default (params, processor) => dotnetbuilderwrapper({
    "ApiKey": settings.nugetApiKey,
    "NugetHost": settings.nugetHost,
    "Package": join(processor.context.exported, params.Package),
    "command": "nugetpush"
}, processor);
