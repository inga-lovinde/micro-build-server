exports.image = function(req, res){
	console.log(req.headers);
        res.setHeader('Content-Type', 'image/svg+xml');
	res.render('status-image', { title: 'Express' + req + "qq", status: "Error" });
};
