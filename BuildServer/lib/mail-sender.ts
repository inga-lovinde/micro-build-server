"use strict";

export const send = (message, callback) => {
    console.log("Mail sender is not implemented");
    console.log(message.title);
    process.nextTick(callback);
};
