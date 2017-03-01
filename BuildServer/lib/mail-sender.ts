"use strict";

export const send = (message, callback) => process.nextTick(callback);
