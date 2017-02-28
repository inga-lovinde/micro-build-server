"use strict";

import * as _ from "underscore";
import dotnetnugetprocessinternal from "./dotnetnugetprocessinternal";

export default ((params, processor) => dotnetnugetprocessinternal(_.extendOwn(params, {
    getFinalTask: (nupkg) => ({
        params: { filename: nupkg },
        type: "copy",
    }),
}), processor)) as Task;
