var builder = require('../lib/builder');

exports.get = function (req, res) {
	res.render('manual');
};

exports.post = function (req, res) {
	var options = req.body;
	options.url = "https://pos-github.payonline.ru/" + options.owner + "/" + options.reponame;
	options.app = req.app;

	builder.build(options, function (err, result) {
		console.log("Done processing manual request");
		console.log("Error: " + err);
		//console.log("Result:");
		//console.log(result);
		res.render('manual-done', {err: err, result: result});
		//res.render("manual-done", { err: err, result: result });
	});
};
