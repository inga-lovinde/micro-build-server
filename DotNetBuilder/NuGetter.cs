using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using NuGet;
using NuGet.Common;

namespace MicroBuildServer.DotNetBuilder
{
	static class NuGetter
	{
		private class Console : IConsole
		{
			public readonly IList<Response.Message> Messages = new List<Response.Message>();

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
				get { throw new NotImplementedException(); }
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
				Messages.Add(Response.Message.CreateInfo(value));
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
				Messages.Add(Response.Message.CreateError(value));
			}

			public void WriteError(object value)
			{
				WriteError(value.ToString());
			}

			public void WriteLine(ConsoleColor color, string value, params object[] args)
			{
				throw new NotImplementedException();
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
				throw new NotImplementedException();
			}

			public void WriteWarning(string value, params object[] args)
			{
				WriteWarning(string.Format(value, args));
			}

			public void WriteWarning(bool prependWarningText, string value)
			{
				throw new NotImplementedException();
			}

			public void WriteWarning(string value)
			{
				Messages.Add(Response.Message.CreateWarn(value));
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

		public static Response Publish(NuGetRequest request)
		{
			var console = new Console();
			var command = new NuGet.Commands.PackCommand
			{
				BasePath = request.BaseDirectory,
				OutputDirectory = request.OutputDirectory,
				Version = request.Version,
				Console = console,
				Verbosity = Verbosity.Detailed,
				Rules = new IPackageRule[0],
			};
			command.Arguments.Add(request.SpecPath);
			command.Execute();

			return new Response { Messages = console.Messages.ToArray() };
		}
	}
}
