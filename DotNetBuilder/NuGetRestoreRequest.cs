namespace MicroBuildServer.DotNetBuilder
{
    class NuGetRestoreRequest
    {
        public string BaseDirectory { get; set; }

        public string SolutionPath { get; set; }
    }
}
