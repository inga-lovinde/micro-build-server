using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace MicroBuildServer.DotNetBuilder
{
	[Serializable]
	class Response
	{
		[Serializable]
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

			public override string ToString()
			{
				return string.Format("{0}: {1}", Type, Body);
			}
		}

		public Message[] Messages { get; set; }
	}
}
