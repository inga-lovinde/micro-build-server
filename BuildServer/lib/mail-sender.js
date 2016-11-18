"use strict";

const nodemailer = require('nodemailer');
const settings = require('../settings');

exports.send = (message, callback) => {
	return process.nextTick(callback);
/*
	var transport = nodemailer.createTransport("SMTP", settings.smtp);
	transport.sendMail(message, (err, result) => {
		transport.close();
		callback(err, result);
	});
*/
};