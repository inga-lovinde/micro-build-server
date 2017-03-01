"use strict";

import { readdirSync } from "fs";
import * as _ from "underscore";

const taskNames = _.unique(readdirSync(__dirname).map((file) => {
    if (file.match(/\.ts$/) !== null) {
        return file.substr(0, file.length - 3);
    }

    if (file.match(/\.js$/) !== null) {
        return file.substr(0, file.length - 3);
    }

    return "";
}).filter((file) => file && file !== "index"));

export default _.object(taskNames.map((name) => [name, require(`./${name}`).default])) as Tasks;
