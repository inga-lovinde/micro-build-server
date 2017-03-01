"use strict";

import { join } from "path";

import settings from "../../settings";
import { Task } from "../../types";
import dotnetbuilderwrapper from "./dotnetbuilderwrapper";

export default ((params, processor) => dotnetbuilderwrapper({
    ApiKey: settings.nugetApiKey,
    NugetHost: settings.nugetHost,
    Package: join(processor.context.exported, params.Package),
    command: "nugetpush",
}, processor)) as Task;
