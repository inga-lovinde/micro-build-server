"use strict";

import * as express from "express";

import { Settings } from "./types";

const getSettings = (app: express.Application): Settings => app.get("mbsSettings");

const setSettings = (app: express.Application, settings: Settings) => app.set("mbsSettings", settings);

export {
    getSettings,
    setSettings,
};
