"use strict";

import * as fs from "fs";
import { gracefulify } from "graceful-fs";

gracefulify(fs);

import { json as bodyJson, urlencoded as bodyUrlencoded } from "body-parser";
import * as errorhandler from "errorhandler";
import * as express from "express";
import { createServer } from "http";
import * as methodOverride from "method-override";
import * as morgan from "morgan";
import { join } from "path";
import * as serveFavicon from "serve-favicon";
import * as serveStatic from "serve-static";

import settings from "../settings";
import * as routes from "./routes";

const app = express();

app.set("port", settings.port);
app.set("views", join(__dirname, "views"));
app.set("view engine", "jade");
app.set("gitpath", settings.gitpath);
app.set("tmpcodepath", settings.tmpcodepath);
app.set("releasepath", settings.releasepath);
app.use(serveFavicon(join(__dirname, "public/images/favicon.png")));
app.use(morgan("dev"));
app.use(bodyJson({ limit: "10mb" }));
app.use(bodyUrlencoded({ extended: false }));
app.use(methodOverride());
app.use(serveStatic(join(__dirname, "public")));

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

createServer(app).listen(app.get("port"), () => console.log(`Express server listening on port ${app.get("port")}`));
