"use strict";

const realFs = require("fs");
const fs = require("graceful-fs");

fs.gracefulify(realFs);

const express = require("express");
const routes = require("./routes");
const http = require("http");
const path = require("path");
const serveFavicon = require("serve-favicon");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const serveStatic = require("serve-static");
const errorhandler = require("errorhandler");

const settings = require("./settings");

const app = express();

// All environments
app.set("port", process.env.PORT || settings.port);
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
