"use strict";

import * as _ from "underscore";

import { Task } from "../../types";
import dotnetnugetprocessinternal from "./dotnetnugetprocessinternal";

export default ((params, processor) => dotnetnugetprocessinternal(_.extendOwn(params, {
    getFinalTask: (nupkg) => ({
        params: { Package: nupkg },
        type: "dotnetnugetpushonly",
    }),
}), processor)) as Task;
