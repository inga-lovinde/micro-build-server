"use strict";

const sequential = require('./sequential');

module.exports = (params, processor) => sequential({
    tasks: [
        {
            type: "dotnetbuilderwrapper",
            params: {
                command: "nugetrestore",
                BaseDirectory: processor.context.exported,
                SolutionPath: processor.context.exported + "/" + params.solution
            }
        }
    ]
}, processor);
