"use strict";

import postreceive = require("./postreceive");
import manual = require("./manual");
import status = require("./status");
import artifact = require("./artifact");
import release = require("./release");

const index = (req, res) => res.render("index", { "title": `Express<br/>\r\n${req}` });

export { index, postreceive, manual, status, artifact, release };

