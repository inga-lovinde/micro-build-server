using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Build.Evaluation;
using Microsoft.Build.Execution;
using Microsoft.Build.Framework;
using Microsoft.Build.Utilities;

namespace MicroBuildServer.DotNetBuilder
{
	static class Compiler
	{
		private class CompilerLogger : Logger
		{
			public readonly IList<Tuple<string, string>> Messages = new List<Tuple<string, string>>();

			private int indent = 0;

			public override void Initialize(IEventSource eventSource)
			{
				if (eventSource == null)
				{
					throw new ArgumentNullException("eventSource");
				}
				eventSource.ProjectStarted += OnProjectStarted;
				eventSource.ProjectFinished += OnProjectFinished;
				eventSource.ErrorRaised += OnError;
				eventSource.WarningRaised += OnWarning;
				eventSource.MessageRaised += OnMessage;
			}

			private void OnProjectStarted(object sender, ProjectStartedEventArgs e)
			{
				Messages.Add(Tuple.Create("info", GetLine("Started {0}", e.ProjectFile)));
				indent++;
			}

			private void OnProjectFinished(object sender, ProjectFinishedEventArgs e)
			{
				indent--;
				Messages.Add(Tuple.Create("info", GetLine("Finished {0}", e.ProjectFile)));
			}

			private void OnError(object sender, BuildErrorEventArgs e)
			{
				Messages.Add(Tuple.Create("error", GetLine("{0} ({1}:{2},{3})", e.Message, e.File, e.LineNumber, e.ColumnNumber)));
			}

			private void OnWarning(object sender, BuildWarningEventArgs e)
			{
				Messages.Add(Tuple.Create("warn", GetLine("{0} ({1}:{2},{3})", e.Message, e.File, e.LineNumber, e.ColumnNumber)));
			}

			private void OnMessage(object sender, BuildMessageEventArgs e)
			{
				if (e.Importance != MessageImportance.High) return;
				Messages.Add(Tuple.Create("info", GetLine("{0}: {1}", e.Importance, e.Message)));
			}

			private string GetLine(string format, params object[] args)
			{
				var result = new string('\t', indent) + string.Format(format, args);
				Console.WriteLine(result);
				return result;
			}
		}

		public static Response Compile(CompileRequest request)
		{
			var logger = new CompilerLogger();
			logger.Verbosity = LoggerVerbosity.Normal;

			var pc = new ProjectCollection();
			var globalProperty = new Dictionary<string, string>();
			globalProperty.Add("Configuration", "Release");
			globalProperty.Add("Platform", "Any CPU");
			globalProperty.Add("OutputPath", request.OutputPath);

			var buildRequest = new BuildRequestData(request.SolutionPath, globalProperty, null, new string[] { "Build" }, null);

			var parameters = new BuildParameters(pc);
			parameters.Loggers = new ILogger[] { logger };
			parameters.DetailedSummary = true;

			var buildResult = BuildManager.DefaultBuildManager.Build(parameters, buildRequest);

			Console.WriteLine("BuildResult: {0}", buildResult.OverallResult);
			Console.WriteLine("Targets built: {0}", string.Join(", ", buildResult.ResultsByTarget.Keys));
			Console.WriteLine("Build items: {0}", string.Join(", ", buildResult.ResultsByTarget["Build"].Items.Select(x => x.ItemSpec)));

			return new Response
			{
				Messages = logger.Messages.Select(x => new Response.Message {Type = x.Item1, Body = x.Item2}).ToArray(),
			};
		}
	}
}
