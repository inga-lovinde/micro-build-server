"use strict";

export default (req, res) => {
    const options = {
        "branch": `/refs/heads/${req.params.branch}`,
        "branchName": req.params.branch,
        "file": req.params[0],
        "owner": req.params.owner,
        "reponame": req.params.reponame,
        "rev": req.params.rev
    };

    const pathParts = [req.app.get("releasepath"), options.owner, options.reponame, options.branch, options.rev, options.file];

    res.sendfile(pathParts.join("/"));
};
