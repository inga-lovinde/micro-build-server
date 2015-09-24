using Newtonsoft.Json;
using System;

namespace MicroBuildServer.DotNetBuilder
{
	[JsonObject(MemberSerialization = MemberSerialization.OptIn)]
	[Serializable]
	class Response
	{
		[JsonObject(MemberSerialization = MemberSerialization.OptIn)]
		[Serializable]
		private class ResponseMessage
		{
			[JsonProperty(Required = Required.Always)]
			public string Type { get; set; }

			[JsonProperty(Required = Required.Always)]
			public string Body { get; set; }
		}

		[JsonProperty(Required = Required.Always, PropertyName = "Messages")]
		private ResponseMessage[] Messages { get; set; }

		public Response(Messages messages)
		{
			Messages = messages.ToArray(message => new ResponseMessage
			{
				Type = message.Type,
				Body = message.Body,
			});
		}
	}
}
