using System;
using System.Collections.Generic;
using System.Linq;
using NuGet;
using NuGet.Commands;
using NuGet.Common;

namespace MicroBuildServer.DotNetBuilder
{
	static class NuGetter
	{
		private class Console : IConsole
		{
			public readonly Messages Messages = new Messages();

			public bool Confirm(string description)
			{
				throw new NotImplementedException();
			}

			public int CursorLeft
			{
				get { throw new NotImplementedException(); }
				set { throw new NotImplementedException(); }
			}

			public bool IsNonInteractive
			{
				get { return true; }
				set { throw new NotImplementedException(); }
			}

			public void PrintJustified(int startIndex, string text, int maxWidth)
			{
				throw new NotImplementedException();
			}

			public void PrintJustified(int startIndex, string text)
			{
				throw new NotImplementedException();
			}

			public ConsoleKeyInfo ReadKey()
			{
				throw new NotImplementedException();
			}

			public string ReadLine()
			{
				throw new NotImplementedException();
			}

			public void ReadSecureString(System.Security.SecureString secureString)
			{
				throw new NotImplementedException();
			}

			public Verbosity Verbosity
			{
				get { return Verbosity.Detailed; }
				set { throw new NotImplementedException(); }
			}

			public int WindowWidth
			{
				get { throw new NotImplementedException(); }
				set { throw new NotImplementedException(); }
			}

			public void Write(string format, params object[] args)
			{
				Write(string.Format(format, args));
			}

			public void Write(string value)
			{
				Messages.Add(Message.CreateInfo(value));
			}

			public void Write(object value)
			{
				Write(value.ToString());
			}

			public void WriteError(string format, params object[] args)
			{
				WriteError(string.Format(format, args));
			}

			public void WriteError(string value)
			{
				Messages.Add(Message.CreateError(value));
			}

			public void WriteError(object value)
			{
				WriteError(value.ToString());
			}

			public void WriteLine(ConsoleColor color, string value, params object[] args)
			{
				WriteLine(value, args);
			}

			public void WriteLine(string format, params object[] args)
			{
				Write(format, args);
			}

			public void WriteLine(string value)
			{
				Write(value);
			}

			public void WriteLine(object value)
			{
				Write(value);
			}

			public void WriteLine()
			{
			}

			public void WriteWarning(bool prependWarningText, string value, params object[] args)
			{
                WriteWarning(value, args);
			}

			public void WriteWarning(string value, params object[] args)
			{
				WriteWarning(string.Format(value, args));
			}

			public void WriteWarning(bool prependWarningText, string value)
			{
                WriteWarning(value);
			}

			public void WriteWarning(string value)
			{
				Messages.Add(Message.CreateWarn(value));
			}

			public void Log(MessageLevel level, string message, params object[] args)
			{
				switch (level)
				{
					case MessageLevel.Error:
						WriteError(message, args);
						return;
					case MessageLevel.Warning:
						WriteWarning(message, args);
						return;
					case MessageLevel.Info:
						Write(message, args);
						return;
				}
			}

			public FileConflictResolution ResolveFileConflict(string message)
			{
				throw new NotImplementedException();
			}
		}

		public static Response Pack(NuGetPackRequest request)
		{
			var console = new Console();
			PackageBuilder builder = new PackageBuilder();
			var command = new PackCommand
			{
				BasePath = PathTools.OptimizePath(request.BaseDirectory),
				OutputDirectory = PathTools.OptimizePath(request.OutputDirectory),
				Version = request.Version,
				Console = console,
				Verbosity = Verbosity.Detailed,
				Rules = new IPackageRule[0],
			};
			command.Arguments.Add(request.SpecPath);

			try
			{
				command.Execute();
			}
			catch (Exception e)
			{
				console.WriteError(e);
			}

			return new Response(console.Messages);
		}

		public static Response Push(NuGetPushRequest request)
		{
			var console = new Console();
			var command = new PushCommand
			{
				Source = request.NugetHost,
				ApiKey = request.ApiKey,
				Console = console,
				Verbosity = Verbosity.Detailed,
			};
			command.Arguments.Add(request.Package);

			try
			{
				command.Execute();
			}
			catch (Exception e)
			{
				console.WriteError(e);
			}

			return new Response(console.Messages);
		}

		public static Response Restore(NuGetRestoreRequest request)
		{
			var console = new Console();
			PackageBuilder builder = new PackageBuilder();
			var command = new RestoreCommand
			{
				FileSystem = new PhysicalFileSystem(PathTools.OptimizePath(request.BaseDirectory)),
				Console = console,
				Verbosity = Verbosity.Detailed,
			};
			command.Arguments.Add(request.SolutionPath);

			try
			{
				command.Execute();
			}
			catch (Exception e)
			{
				console.WriteError(e);
			}

			return new Response(console.Messages);
		}
	}
}
