"use strict";

import realFs = require("fs");
import fs = require("graceful-fs");

fs.gracefulify(realFs);

import express = require("express");
import routes = require("./routes");
import http = require("http");
import path = require("path");
import serveFavicon = require("serve-favicon");
import morgan = require("morgan");
import bodyParser = require("body-parser");
import methodOverride = require("method-override");
import serveStatic = require("serve-static");
import errorhandler = require("errorhandler");

import settings = require("./settings");

const app = express();

app.set("port", settings.port); // eslint-disable-line no-process-env
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.set("gitpath", settings.gitpath);
app.set("tmpcodepath", settings.tmpcodepath);
app.set("releasepath", settings.releasepath);
app.use(serveFavicon(path.join(__dirname, "public/images/favicon.png")));
app.use(morgan("dev"));
app.use(bodyParser.json({ "limit": "10mb" }));
app.use(bodyParser.urlencoded({ "extended": false }));
app.use(methodOverride());
app.use(serveStatic(path.join(__dirname, "public")));

if (app.get("env") === "development") {
    app.use(errorhandler());
}

app.route("/").get(routes.index);
app.route("/github/postreceive")
    .post(routes.postreceive)
    .get((req, res) => res.send("Only automated POST requests are allowed for postreceive route"));

app.route("/manual")
    .get(routes.manual.get)
    .post(routes.manual.post);

app.route("/status/:owner/:reponame/:branch/:rev?").get(routes.status.page);
app.route("/pos-github.payonline.ru/*").get(routes.status.pageFromGithub);
app.route("/status.svg").get(routes.status.image);
app.route("/release/:owner/:reponame/:branch/:rev").get(routes.release);
app.route("/artifact/:owner/:reponame/:branch/:rev/*").get(routes.artifact);

http.createServer(app).listen(app.get("port"), () => console.log(`Express server listening on port ${app.get("port")}`));
