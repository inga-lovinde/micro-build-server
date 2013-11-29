using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace MicroBuildServer.DotNetBuilder
{
	class NuGetRequest
	{
		public string BaseDirectory { get; set; }

		public string SpecPath { get; set; }

		public string OutputDirectory { get; set; }

		public string Version { get; set; }
	}
}
