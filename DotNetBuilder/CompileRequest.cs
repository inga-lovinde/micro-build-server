using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace MicroBuildServer.DotNetBuilder
{
	class CompileRequest
	{
		public string SolutionPath { get; set; }

		public string OutputPath { get; set; }
	}
}
