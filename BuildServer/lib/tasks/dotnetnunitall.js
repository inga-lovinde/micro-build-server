"use strict";

var glob = require('glob');
var dotNetBuilderWrapper = require('./dotnetbuilderwrapper');

module.exports = function (params, processor) {
	return {
		process: function () {
			glob("**/bin/**/*.{Tests,Test}.dll", {cwd: processor.context.exported}, function (err, files) {
				if (err) {
					processor.onError(err);
					return processor.done();
				}

				if (!files || !files.length) {
					processor.onError("No test assemblies found");
					return processor.done();
				}

				return processor.processTask({
					type: "parallel",
					params: {
						tasks: files.map(function (file) {
							return {
								name: file,
								type: "dotnetnunit",
								params: {
									assembly: file
								}
							};
						})
					}
				}, processor.done.bind(processor));
			})
		}
	};
};