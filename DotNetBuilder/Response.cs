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
		}

		public Message[] Messages { get; set; }
	}
}
