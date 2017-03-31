"use strict";

import { GenericTask } from "../types";
import sequential from "./sequential";

interface IParameters {
    readonly eslintExcludeFiles: boolean;
}

export default ((params, processor) => sequential({
    tasks: [
        {
            params: { excludeFiles: params.eslintExcludeFiles },
            type: "eslintbrowserall",
        },
        {
            params: { },
            type: "uglifyjsall",
        },
        {
            params: { },
            type: "cssnanoall",
        },
        {
            params: {
                data: processor.context.versionInfo,
                filename: "version.txt",
            },
            type: "writefile",
        },
        {
            params: {
                archive: `${processor.context.reponame}.zip`,
                directory: "",
            },
            type: "zip",
        },
    ],
}, processor)) as GenericTask<IParameters>;
