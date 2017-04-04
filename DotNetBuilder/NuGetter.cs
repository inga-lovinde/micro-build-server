using System;
using System.Security;
using NuGet.CommandLine;
using NuGet.Common;

namespace MicroBuildServer.DotNetBuilder
{
    static class NuGetter
    {
        private class Console : NuGet.CommandLine.IConsole, NuGet.Common.ILogger
        {
            public readonly Messages Messages = new Messages();

            int IConsole.CursorLeft
            {
                get { throw new NotImplementedException(); }
                set { throw new NotImplementedException(); }
            }

            bool IConsole.IsNonInteractive
            {
                get { throw new NotImplementedException(); }
                set { throw new NotImplementedException(); }
            }

            Verbosity IConsole.Verbosity
            {
                get { return Verbosity.Detailed; }
                set { throw new NotImplementedException(); }
            }

            int IConsole.WindowWidth
            {
                get { throw new NotImplementedException(); }
                set { throw new NotImplementedException(); }
            }

            bool IConsole.Confirm(string description)
            {
                throw new NotImplementedException();
            }

            void IConsole.PrintJustified(int startIndex, string text)
            {
                throw new NotImplementedException();
            }

            void IConsole.PrintJustified(int startIndex, string text, int maxWidth)
            {
                throw new NotImplementedException();
            }

            ConsoleKeyInfo IConsole.ReadKey()
            {
                throw new NotImplementedException();
            }

            string IConsole.ReadLine()
            {
                throw new NotImplementedException();
            }

            void IConsole.ReadSecureString(SecureString secureString)
            {
                throw new NotImplementedException();
            }

            void IConsole.Write(string value) => this.WriteInfo(value);

            void IConsole.Write(object value) => this.WriteInfo(value.ToString());

            void IConsole.Write(string format, params object[] args) => this.WriteInfo(string.Format(format, args));

            void IConsole.WriteError(string value) => this.WriteError(value);

            void IConsole.WriteError(object value) => this.WriteError(value.ToString());

            void IConsole.WriteError(string format, params object[] args) => this.WriteError(string.Format(format, args));

            void IConsole.WriteLine()
            {
            }

            void IConsole.WriteLine(string value) => this.WriteInfo(value);

            void IConsole.WriteLine(object value) => this.WriteInfo(value.ToString());

            void IConsole.WriteLine(string format, params object[] args) => this.WriteInfo(string.Format(format, args));

            void IConsole.WriteLine(ConsoleColor color, string value, params object[] args) => this.WriteInfo(string.Format(value, args));

            void IConsole.WriteWarning(string value) => this.WriteWarning(value);

            void IConsole.WriteWarning(string value, params object[] args) => this.WriteWarning(string.Format(value, args));

            void IConsole.WriteWarning(bool prependWarningText, string value) => this.WriteWarning(value);

            void IConsole.WriteWarning(bool prependWarningText, string value, params object[] args) => this.WriteWarning(string.Format(value, args));

            void ILogger.LogDebug(string data) => this.WriteInfo(data);

            void ILogger.LogError(string data) => this.WriteError(data);

            void ILogger.LogErrorSummary(string data) => this.WriteError(data);

            void ILogger.LogInformation(string data) => this.WriteInfo(data);

            void ILogger.LogInformationSummary(string data) => this.WriteInfo(data);

            void ILogger.LogMinimal(string data) => this.WriteInfo(data);

            void ILogger.LogVerbose(string data) => this.WriteInfo(data);

            void ILogger.LogWarning(string data) => this.WriteWarning(data);

            public void WriteInfo(string value) => this.Messages.Add(Message.CreateInfo(value));

            public void WriteWarning(string value) => this.Messages.Add(Message.CreateWarn(value));

            public void WriteError(string value) => this.Messages.Add(Message.CreateError(value));
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
                CurrentDirectory = request.BaseDirectory,
                Verbosity = Verbosity.Detailed,
            };
            command.Arguments.Add(request.SpecPath);

            try
            {
                command.Execute();
            }
            catch (Exception e)
            {
                console.WriteError(e.ToString());
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
                console.WriteError(e.ToString());
            }

            return new Response(console.Messages);
        }

        public static Response Restore(NuGetRestoreRequest request)
        {
            var console = new Console();
            var command = new RestoreCommand
            {
                Console = console,
                CurrentDirectory = request.BaseDirectory,
                Verbosity = Verbosity.Detailed,
            };
            command.Arguments.Add(request.SolutionPath);

            try
            {
                command.Execute();
            }
            catch (Exception e)
            {
                console.WriteError(e.ToString());
            }

            return new Response(console.Messages);
        }
    }
}
