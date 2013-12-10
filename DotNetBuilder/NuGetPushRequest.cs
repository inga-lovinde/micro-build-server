namespace MicroBuildServer.DotNetBuilder
{
	class NuGetPushRequest
	{
		public string Package { get; set; }

		public string NugetHost { get; set; }

		public string ApiKey { get; set; }
	}
}
