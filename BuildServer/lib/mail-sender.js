"use strict";

var nodemailer = require('nodemailer');
var settings = require('../settings');

exports.send = function (message, callback) {
	var transport = nodemailer.createTransport("SMTP", settings.smtp);
	transport.sendMail(message, function(err, result) {
		transport.close();
		callback(err, result);
	});
};