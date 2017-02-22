"use strict";

import postreceive from "./postreceive";
import * as manual from "./manual";
import * as status from "./status";
import artifact from "./artifact";
import release from "./release";

const index = (req, res) => res.render("index", { "title": `Express<br/>\r\n${req}` });

export { index, postreceive, manual, status, artifact, release };

