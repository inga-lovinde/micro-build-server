"use strict";

import { Task } from "../types";

export default ((params, processor) => processor.done()) as Task;
