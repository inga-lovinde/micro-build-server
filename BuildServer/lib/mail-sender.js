"use strict";

exports.send = (message, callback) => process.nextTick(callback);
