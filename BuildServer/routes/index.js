"use strict";

exports.index = (req, res) => res.render("index", { "title": `Express<br/>\r\n${req}` });

exports.postreceive = require("./postreceive");
exports.manual = require("./manual");
exports.status = require("./status");
exports.artifact = require("./artifact");
exports.release = require("./release");
