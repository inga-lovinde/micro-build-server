"use strict";

interface IMessage {
    from: string;
    headers: { [headerName: string]: any };
    subject: string;
    text: string;
    to: string;
}

export const send = (message: IMessage, callback: () => void) => {
    console.log("Mail sender is not implemented");
    console.log(message.subject);
    process.nextTick(callback);
};
