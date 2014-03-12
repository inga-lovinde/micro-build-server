using System;
using System.Collections.Generic;
using System.Linq;
using NUnit.Core;

namespace MicroBuildServer.DotNetBuilder
{
	class NUnitTester
	{
		private const string DATA_TEST_RESULTS_KEY = "TestResults";

		private class Listener : EventListener
		{
			public readonly List<Response.Message> Messages = new List<Response.Message>();

			private bool runFail;
			private bool suiteFail;

			private static bool IsSuccess(TestResult result)
			{
				return result.IsSuccess || result.ResultState == ResultState.Ignored;
			}

			private static string FormatResult(TestResult result)
			{
				var additional = new List<string>();
				if (result.IsSuccess)
				{
					additional.Add("success");
				}
				else if (result.IsError)
				{
					additional.Add("error");
				}
				else if (result.IsFailure)
				{
					additional.Add("fail");
				}
				else if (result.ResultState == ResultState.Ignored)
				{
					additional.Add("ignored");
				}
				else
				{
					additional.Add("status unknown");
				}

				if (!string.IsNullOrEmpty(result.Message))
				{
					additional.Add("message = " + result.Message);
				}
				return additional.Any() ? result.Name + "; " + string.Join(", ", additional) : result.Name;
			}

			public void RunFinished(Exception exception)
			{
				Messages.Add(Response.Message.CreateError("Run finished: " + exception));
				runFail = true;
			}

			public void RunFinished(TestResult result)
			{
				var message = string.Format("Run finished: {0}", FormatResult(result));

				if (!IsSuccess(result) && !runFail)
				{
					Messages.Add(Response.Message.CreateError(message));
				}
				else
				{
					Messages.Add(Response.Message.CreateInfo(message));
				}
			}

			public void RunStarted(string name, int testCount)
			{
				Messages.Add(Response.Message.CreateInfo("Run started: " + name));
				runFail = false;
			}

			public void SuiteFinished(TestResult result)
			{
				var message = string.Format("Suite finished: {0}", FormatResult(result));

				if (!IsSuccess(result) && !suiteFail)
				{
					Messages.Add(Response.Message.CreateError(message));
				}
				else
				{
					Messages.Add(Response.Message.CreateInfo(message));
				}

				if (!result.IsSuccess)
				{
					runFail = true;
				}
			}

			public void SuiteStarted(TestName testName)
			{
				Messages.Add(Response.Message.CreateInfo("Suite started: " + testName.Name));
				suiteFail = false;
			}

			public void TestFinished(TestResult result)
			{
				var message = string.Format("Test finished: {0}", FormatResult(result));

				if (!IsSuccess(result))
				{
					Messages.Add(Response.Message.CreateError(message));
				}
				else
				{
					Messages.Add(Response.Message.CreateInfo(message));
				}
				suiteFail = true;
			}

			public void TestOutput(TestOutput testOutput)
			{
				Messages.Add(Response.Message.CreateInfo("Test output: " + testOutput.Text));
			}

			public void TestStarted(TestName testName)
			{
				Messages.Add(Response.Message.CreateInfo("Test started: " + testName.Name));
			}

			public void UnhandledException(Exception exception)
			{
				Messages.Add(Response.Message.CreateError("Unhandled exception: " + exception));
				suiteFail = true;
				runFail = true;
			}
		}

		[Serializable]
		private class TestWorker
		{
			public string TestLibraryPath { get; set; }

			public void DoTest()
			{
				var listener = new Listener();
				CoreExtensions.Host.InitializeService();
				var package = new TestPackage(TestLibraryPath);
				//package.AutoBinPath = true;
				//package.BasePath = Path.GetDirectoryName(TestLibraryPath);
				//package.ConfigurationFile = TestLibraryPath + ".config";
				TestRunner runner = new SimpleTestRunner();
				if (runner.Load(package))
				{
					runner.Run(listener, TestFilter.Empty, true, LoggingThreshold.All);
				}
				//DebugTestResult(Console.Out, result);

				var messages = listener.Messages.Any() ? listener.Messages.ToArray() : new[] {Response.Message.CreateError("No messages from listener")};

				AppDomain.CurrentDomain.SetData(DATA_TEST_RESULTS_KEY, new Response { Messages = messages });
			}
		}

		/*private static void DebugTestResult(object rawResult, int level = 0)
		{
			if (rawResult == null)
			{
				Console.WriteLine("Result is null");
				return;
			}

			var prefix = new string('\t', level);
			Console.WriteLine("{0}RESULT START", prefix);
			Console.WriteLine("{0}Type: {1}", prefix, rawResult);
			if (rawResult is TestResult)
			{
				var result = (TestResult) rawResult;
				Console.WriteLine("{0}Full name: {1}", prefix, result.FullName);
				Console.WriteLine("{0}Has results: {1}", prefix, result.HasResults);
				Console.WriteLine("{0}Success? {1}", prefix, result.IsSuccess);
				Console.WriteLine("{0}Message: {1}", prefix, result.Message);
				Console.WriteLine("{0}Test: {1}", prefix, result.Test.TestName);

				if (result.Results != null)
				{
					Console.WriteLine("{0}Results: {1}", prefix, result.Results.Count);
					foreach (var v in result.Results)
					{
						DebugTestResult(v, level+1);
					}
				}
			}
			Console.WriteLine("{0}RESULT END", prefix);
		}*/

		public static Response Test(TestRequest request)
		{
			AppDomainSetup setup = new AppDomainSetup();
			setup.ConfigurationFile = request.TestLibraryPath + ".config";
			AppDomain tester = AppDomain.CreateDomain("tester", AppDomain.CurrentDomain.Evidence, setup);

			var worker = new TestWorker();
			worker.TestLibraryPath = request.TestLibraryPath;

			var del = new CrossAppDomainDelegate(worker.DoTest);
			tester.DoCallBack(del);
			return (Response)(tester.GetData(DATA_TEST_RESULTS_KEY));
		}
	}
}
