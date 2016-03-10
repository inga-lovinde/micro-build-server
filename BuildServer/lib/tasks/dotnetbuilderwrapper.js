"use strict";

var spawn = require('child_process').spawn;
var settings = require("../../settings");

module.exports = function (params, processor) {
	return {
		process: function () {
			var result = "",
				error = "",
				builder = spawn(settings.builderExecutable, [params.command]);

			processor.onInfo("DotNetBuilderWrapper processing (at " + (new Date().toISOString()) + "): " + JSON.stringify(params, null, 4));

			builder.stdout.on('data', function (data) {
				result += data;
			});
			builder.stderr.on('data', function (data) {
				error += data;
			});
			builder.on('exit', function (code) {
				if (code !== 0) {
					error = "Return code is " + code + "\r\n" + error;
					processor.onError(error);
					return processor.done();
				}

				var report = JSON.parse(result);
				var messages = report.Messages;
				for (var i = 0; i < messages.length; i++) {
					if (!messages[i]) {
						processor.onError("Message is null");
						continue;
					}

					switch(messages[i].Type) {
						case "info":
							processor.onInfo(messages[i].Body);
							break;
						case "warn":
							processor.onWarn(messages[i].Body);
							break;
						default:
							processor.onError(messages[i].Body);
							break;
					}
				}

				processor.onInfo("Done DotNetBuilderWrapper processing (at " + (new Date().toISOString()) + ")");
				return processor.done();
			});

			builder.stdin.write(JSON.stringify(params));
			builder.stdin.end();
		}
	};
};
