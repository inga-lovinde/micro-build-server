"use strict";

var spawn = require('child_process').spawn;

module.exports = function (params, processor) {
	return {
		process: function () {
			var result = "",
				error = "",
				builder = spawn("../DotNetBuilder/bin/Debug/DotNetBuilder.exe");

			wrapper.stdout.on('data', function (data) {
				result += data;
			});
			wrapper.stderr.on('data', function (data) {
				error += data;
			});
			wrapper.on('exit', function (code) {
				if (code !== 0) {
					error = "Return code is " + code + "\r\n" + error;
					processor.onError(error);
					return done();
				}

				var report = JSON.parse(result);
				foreach (var i = 0; i < report.length; i++) {
					switch(report[i].Type) {
						case "info":
							processor.onError(report[i].Body);
							break;
						case "warn":
							processor.onError(report[i].Body);
							break;
						default:
							processor.onError(report[i].Body);
							break;
					}
				}
				return done();
			});

			wrapper.stdin.write({
				"SolutionPath": process.context.exported + "/" + params.solution,
				"OutputPath": process.context.release + "/" + params.solution + "/"
			});
			wrapper.stdin.end();
		}
	};
};
