using System;
using System.Collections.Generic;
using System.Linq;
using System.Security;
using NuGet;
using NuGet.CommandLine;
using NuGet.Common;

namespace MicroBuildServer.DotNetBuilder
{
    static class NuGetter
    {
        private class Console : IConsole
        {
            public readonly Messages Messages = new Messages();

            public int CursorLeft
            {
                get { throw new NotImplementedException(); }
                set { throw new NotImplementedException(); }
            }

            public bool IsNonInteractive
            {
                get { throw new NotImplementedException(); }
                set { throw new NotImplementedException(); }
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

            public bool Confirm(string description)
            {
                throw new NotImplementedException();
            }

            public void LogDebug(string data) => this.Messages.Add(Message.CreateInfo(data));

            public void LogError(string data) => this.Messages.Add(Message.CreateError(data));

            public void LogErrorSummary(string data) => this.Messages.Add(Message.CreateError(data));

            public void LogInformation(string data) => this.Messages.Add(Message.CreateInfo(data));

            public void LogInformationSummary(string data) => this.Messages.Add(Message.CreateInfo(data));

            public void LogMinimal(string data) => this.Messages.Add(Message.CreateInfo(data));

            public void LogVerbose(string data) => this.Messages.Add(Message.CreateInfo(data));

            public void LogWarning(string data) => this.Messages.Add(Message.CreateWarn(data));

            public void PrintJustified(int startIndex, string text)
            {
                throw new NotImplementedException();
            }

            public void PrintJustified(int startIndex, string text, int maxWidth)
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

            public void ReadSecureString(SecureString secureString)
            {
                throw new NotImplementedException();
            }

            public void Write(string value) => this.Messages.Add(Message.CreateInfo(value));

            public void Write(object value) => this.Write(value.ToString());

            public void Write(string format, params object[] args) => this.Write(string.Format(format, args));

            public void WriteError(string value) => this.Messages.Add(Message.CreateError(value));

            public void WriteError(object value) => this.WriteError(value.ToString());

            public void WriteError(string format, params object[] args) => this.WriteError(string.Format(format, args));

            public void WriteLine()
            {
            }

            public void WriteLine(string value) => this.Write(value);

            public void WriteLine(object value) => this.Write(value);

            public void WriteLine(string format, params object[] args) => this.Write(format, args);

            public void WriteLine(ConsoleColor color, string value, params object[] args) => this.Write(value, args);

            public void WriteWarning(string value) => this.Messages.Add(Message.CreateWarn(value));

            public void WriteWarning(string value, params object[] args) => this.WriteWarning(string.Format(value, args));

            public void WriteWarning(bool prependWarningText, string value) => this.WriteWarning(value);

            public void WriteWarning(bool prependWarningText, string value, params object[] args) => this.WriteWarning(value, args);
        }

        public static Response Pack(NuGetPackRequest request)
        {
            var console = new Console();
            var command = new PackCommand
            {
                BasePath = PathTools.OptimizePath(request.BaseDirectory),
                OutputDirectory = PathTools.OptimizePath(request.OutputDirectory),
                Version = request.Version,
                Console = console,
                Verbosity = Verbosity.Detailed,
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
