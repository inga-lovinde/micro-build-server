using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace MicroBuildServer.DotNetBuilder
{
	class Response
	{
		public class Message
		{
			public string Type { get; set; }
			public string Body { get; set; }

			public static Message CreateInfo(string body)
			{
				return new Message {Type = "info", Body = body};
			}

			public static Message CreateWarn(string body)
			{
				return new Message { Type = "warn", Body = body };
			}

			public static Message CreateError(string body)
			{
				return new Message { Type = "error", Body = body };
			}
		}

		public Message[] Messages { get; set; }
	}
}
