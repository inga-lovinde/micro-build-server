"use strict";

import artifact from "./artifact";
import * as manual from "./manual";
import postreceive from "./postreceive";
import release from "./release";
import * as status from "./status";

const index = (req, res) => res.render("index", { title: `Express<br/>\r\n${req}` });

export { index, postreceive, manual, status, artifact, release };
