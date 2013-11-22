var builder = require('../lib/builder');

/*
 * POST from github
 */

module.exports = function(req, res){
	if (!req.body || !req.body.payload) {
		res.end();
	}

	var payload = JSON.parse(req.body.payload),
		repository = payload.repository;

	builder.build({
		app: req.app,
		url: repository.url,
		owner: repository.owner.name,
		reponame: repository.name,
		rev: payload.after,
		branch: payload.ref
	}, function (err, result) {
		console.log("Done processing request from GitHub");
		console.log("Error: " + err);
		console.log("Result:");
		console.log(result);
		res.end();
	});
};