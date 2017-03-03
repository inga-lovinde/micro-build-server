"use strict";

import { Settings } from "./types";

const getSettings = (app): Settings => app.get("mbsSettings");

const setSettings = (app, settings: Settings) => app.set("mbsSettings", settings);

export {
    getSettings,
    setSettings,
};
