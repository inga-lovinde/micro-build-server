"use strict";

import { join } from "path";
import dotNetBuilderWrapper from "./dotnetbuilderwrapper";

export default ((params, processor) => dotNetBuilderWrapper({
    TestLibraryPath: join(processor.context.exported, params.assembly),
    command: "nunit",
}, processor)) as Task;
