"use strict";

module.exports = (req, res) => {
    const options = {
        owner: req.params.owner,
        reponame: req.params.reponame,
        branchName: req.params.branch,
        branch: "/refs/heads/" + req.params.branch,
        rev: req.params.rev,
        file: req.params[0]
    };

    res.sendfile(req.app.get('releasepath') + "/" + options.owner + "/" + options.reponame + "/" + options.branch + "/" + options.rev + "/" + options.file);
};
