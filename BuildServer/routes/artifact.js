"use strict";

module.exports = function(req, res) {
	var options = {
		owner: req.params.owner,
		reponame: req.params.reponame,
		branchName: req.params.branch,
		branch: "/refs/heads/" + req.params.branch,
		rev: req.params.rev,
		file: req.params.file
	};

	res.sendfile(req.app.get('releasepath') + "/" + options.owner + "/" + options.reponame + "/" + options.branch + "/" + options.rev + "/" + options.file);
};
