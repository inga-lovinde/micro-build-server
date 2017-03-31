"use strict";

import { join } from "path";

import { GenericTask } from "../types";
import dotnetbuilderwrapper from "./dotnetbuilderwrapper";

export default ((params, processor) => dotnetbuilderwrapper({
    ApiKey: processor.settings.nugetApiKey,
    NugetHost: processor.settings.nugetHost,
    Package: join(processor.context.exported, params.Package),
    command: "nugetpush",
}, processor)) as GenericTask<{ readonly Package: string }>;
