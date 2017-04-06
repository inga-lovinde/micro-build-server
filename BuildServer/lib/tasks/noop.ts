"use strict";

import { GenericTask } from "../types";

export default ((_params) => (processor) => processor.done) as GenericTask<{}>;
