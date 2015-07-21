using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Newtonsoft.Json;

namespace MicroBuildServer.DotNetBuilder
{
	class Program
	{
		private static Response Process(string input, string[] args)
		{
			try
			{
				switch (args[0])
				{
					case "compile":
						return Compiler.Compile(JsonConvert.DeserializeObject<CompileRequest>(input));
					case "nunit":
						return NUnitTester.Test(JsonConvert.DeserializeObject<TestRequest>(input));
					case "nugetpack":
						return NuGetter.Pack(JsonConvert.DeserializeObject<NuGetPackRequest>(input));
					case "nugetpush":
						return NuGetter.Push(JsonConvert.DeserializeObject<NuGetPushRequest>(input));
					case "nugetrestore":
						return NuGetter.Restore(JsonConvert.DeserializeObject<NuGetRestoreRequest>(input));
					default:
						throw new ApplicationException("Unsupported type '" + args[0] + "'");
				}
			}
			catch (Exception e)
			{
				return new Response { Messages = new[] { Response.Message.CreateError(e.ToString()) } };
			}
		}

		static void Main(string[] args)
		{
			Console.InputEncoding = Encoding.UTF8;
			Console.OutputEncoding = Encoding.UTF8;
			var input = Console.In.ReadToEnd();
			var outWriter = Console.Out;
			Console.SetOut(new StubWriter());
			var result = Process(input, args);
			outWriter.Write(JsonConvert.SerializeObject(result, Formatting.Indented));
		}
	}
}
