using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Newtonsoft.Json;

namespace MicroBuildServer.DotNetBuilder
{
	class Program
	{
		private static Response Test(TestRequest request)
		{
			throw new NotImplementedException();
		}

		private static Response Process(string input, string[] args)
		{
			try
			{
				switch (args[0])
				{
					case "compile":
						return Compiler.Compile(JsonConvert.DeserializeObject<CompileRequest>(input));
					case "test":
						return Test(JsonConvert.DeserializeObject<TestRequest>(input));
					case "nuget":
						return NuGetter.Publish(JsonConvert.DeserializeObject<NuGetRequest>(input));
					default:
						throw new ApplicationException("Unsupported type '" + args[0] + "'");
				}
			}
			catch (Exception e)
			{
				return new Response { Messages = new[] { new Response.Message { Type = "error", Body = e.ToString() } } };
			}
		}

		static void Main(string[] args)
		{
			var input = Console.In.ReadToEnd();
			var result = Process(input, args);
			Console.Write(JsonConvert.SerializeObject(result, Formatting.Indented));
		}
	}
}
