using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Build.Evaluation;
using Microsoft.Build.Execution;
using Microsoft.Build.Framework;
using Microsoft.Build.Utilities;
using System.Reflection;
using System.IO;

namespace MicroBuildServer.DotNetBuilder
{
	static class Compiler
	{
		private class CompilerLogger : Logger
		{
			public readonly Messages Messages = new Messages();

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
				Messages.Add(Message.CreateInfo(GetLine("Started {0}", e.ProjectFile)));
				indent++;
			}

			private void OnProjectFinished(object sender, ProjectFinishedEventArgs e)
			{
				indent--;
				Messages.Add(Message.CreateInfo(GetLine("Finished {0}", e.ProjectFile)));
			}

			private void OnError(object sender, BuildErrorEventArgs e)
			{
				Messages.Add(Message.CreateError(GetLine("{0} (#{1}, {2}:{3},{4})", e.Message, e.Code, e.File, e.LineNumber, e.ColumnNumber)));
			}

			private void OnWarning(object sender, BuildWarningEventArgs e)
			{
				Messages.Add(Message.CreateWarn(GetLine("{0} (#{1}, {2}:{3},{4})", e.Message, e.Code, e.File, e.LineNumber, e.ColumnNumber)));
			}

			private void OnMessage(object sender, BuildMessageEventArgs e)
			{
				//if (e.Importance != MessageImportance.High) return;
				Messages.Add(Message.CreateInfo(GetLine("{0}: {1}", e.Importance, e.Message)));
			}

			private string GetLine(string format, params object[] args)
			{
				var result = new string('\t', indent) + string.Format(format, args);
				return result;
			}
		}

		public static readonly string BuilderAssemblyDirectory = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

		public static Response Compile(CompileRequest request)
		{
			var logger = new CompilerLogger();
			logger.Verbosity = LoggerVerbosity.Detailed;

			var pc = new ProjectCollection();
			var globalProperty = new Dictionary<string, string>();
			globalProperty.Add("Configuration", request.Configuration ?? "Release");
			globalProperty.Add("Platform", "Any CPU");
			globalProperty.Add("VisualStudioVersion", "14.0");
			if (!string.IsNullOrEmpty(request.OutputDirectory))
			{
				globalProperty.Add("OutputDirectory", request.OutputDirectory);
			}
			if (!string.IsNullOrEmpty(request.SigningKey))
			{
				globalProperty.Add("SignAssembly", "true");
				globalProperty.Add("AssemblyOriginatorKeyFile", request.SigningKey);
			}
			if (!request.SkipCodeAnalysis)
			{
				globalProperty.Add("RunCodeAnalysis", "true");
				globalProperty.Add("CodeAnalysisRuleSet", Path.Combine(BuilderAssemblyDirectory, "AllRules.ruleset"));
				globalProperty.Add("MBSBuilderPath", BuilderAssemblyDirectory);
				globalProperty.Add("CustomBeforeMicrosoftCSharpTargets", Path.Combine(BuilderAssemblyDirectory, "ImportStyleCop.targets"));
			}

			var buildRequest = new BuildRequestData(request.SolutionPath, globalProperty, "14.0", new [] { request.Target }, null);

			var parameters = new BuildParameters(pc);
			parameters.Loggers = new ILogger[] { logger };
			parameters.DetailedSummary = true;

			var buildResult = BuildManager.DefaultBuildManager.Build(parameters, buildRequest);
			if (buildResult.OverallResult == BuildResultCode.Failure)
			{
				logger.Messages.Add(Message.CreateError("BuildResult is false"));
			}

            return new Response(logger.Messages);
		}
	}
}
