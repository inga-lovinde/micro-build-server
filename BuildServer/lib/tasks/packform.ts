"use strict";

import { GenericTask } from "../types";
import cssnanoall from "./cssnanoall";
import eslintbrowserall from "./eslintbrowserall";
import sequential from "./sequential";
import uglifyjsall from "./uglifyjsall";
import writefile from "./writefile";
import zip from "./zip";

interface IParameters {
    readonly eslintExcludeFiles?: string[];
}

export default ((params) => (processor) => sequential({
    tasks: [
        {
            name: "eslint",
            task: eslintbrowserall({ excludeFiles: params.eslintExcludeFiles }),
        },
        {
            name: "uglifyjs",
            task: uglifyjsall({}),
        },
        {
            name: "cssnano",
            task: cssnanoall({}),
        },
        {
            name: "writeversion",
            task: writefile({
                data: processor.context.versionInfo,
                filename: "version.txt",
            }),
        },
        {
            name: "zip",
            task: zip({
                archive: `${processor.context.reponame}.zip`,
                directory: "",
            }),
        },
    ],
})(processor)) as GenericTask<IParameters>;
