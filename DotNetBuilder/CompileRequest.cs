namespace MicroBuildServer.DotNetBuilder
{
	class CompileRequest
	{
		public string SolutionPath { get; set; }

		public string Target { get; set; }

		public string OutputDirectory { get; set; }
	}
}
