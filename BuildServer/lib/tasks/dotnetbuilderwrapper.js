"use strict";

var spawn = require('child_process').spawn;

module.exports = function (params, processor) {
	return {
		process: function () {
			var result = "",
				error = "",
				builder = spawn("../DotNetBuilder/bin/Debug/MicroBuildServer.DotNetBuilder.exe", ["compile"]);

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
				return processor.done();
			});

			builder.stdin.write(JSON.stringify(params));
			builder.stdin.end();
		}
	};
};
