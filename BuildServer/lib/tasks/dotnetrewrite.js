"use strict";

const fs = require('fs');
const async = require('async');
const glob = require('glob');
const settings = require('../../settings');

const addAssemblyAttribute = (content, attribute) => content + "\n" + attribute + "\n";

module.exports = (params, processor) => ({
	process: () => {
		if (processor.context.dotnetrewriterDone) {
			return processor.done();
		}

		processor.context.dotnetrewriterDone = true;

		const processAssemblyInfo = (appendInformationalVersion) => (content, cb) => {
			if (!params.skipCodeSigning && !settings.skipCodeSigning) {
				content = content.replace(
					/InternalsVisibleTo\s*\(\s*"([\w.]+)"\s*\)/g,
					(match, p1) => "InternalsVisibleTo(\"" + p1 + ",PublicKey=" + settings.codeSigningPublicKey + "\")"
				);
			}

			if (appendInformationalVersion) {
				content = addAssemblyAttribute(content, "[assembly: System.Reflection.AssemblyInformationalVersion(\"" + processor.context.versionInfo + "\")]");
			}

			return cb(null, content);
		};

		glob("**/{InternalsVisible,AssemblyInfo}*.cs", {cwd: processor.context.exported}, (err, files) => {
			if (err) {
				processor.onError(err);
				return processor.done();
			}

			processor.onInfo("Found " + files.length + " AssemblyInfo.cs files");

			if (!files || !files.length) {
				processor.onWarn("No AssemblyInfo.cs found");
				return processor.done();
			}

			return async.parallel(files.map((file) => (callback) => async.waterfall([
				fs.readFile.bind(null, processor.context.exported + "/" + file, { encoding: "utf8" }),
				processAssemblyInfo(file.toLowerCase().indexOf("assemblyinfo.cs") >= 0),
				fs.writeFile.bind(null, processor.context.exported + "/" + file)
			], (err) => {
				if (err) {
					processor.onError("Unable to rewrite file " + file + ": " + err);
				} else {
					processor.onInfo("Rewritten file " + file);
				}
				callback(err);
			})), processor.done.bind(processor));
		});
	}
});
