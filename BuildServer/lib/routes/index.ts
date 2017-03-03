"use strict";

import * as express from "express";

import artifact from "./artifact";
import * as manual from "./manual";
import postreceive from "./postreceive";
import release from "./release";
import * as status from "./status";

const index: express.RequestHandler = (req, res) => res.render("index", { title: `Express<br/>\r\n${req}` });

export { index, postreceive, manual, status, artifact, release };
