"use strict";

exports.index = (req, res) => res.render('index', { title: 'Express' + req + "qq" });

exports.postreceive = require('./postreceive');
exports.manual = require('./manual');
exports.status = require('./status');
exports.artifact = require('./artifact');
exports.release = require('./release');
