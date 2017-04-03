using Newtonsoft.Json;

namespace MicroBuildServer.DotNetBuilder
{
    public class Message
    {
        public readonly string Type;

        public readonly string Body;

        private Message(string type, string body)
        {
            Type = type;
            Body = body;
        }

        public static Message CreateInfo(string body)
        {
            return new Message("info", body);
        }

        public static Message CreateWarn(string body)
        {
            return new Message("warn", body);
        }

        public static Message CreateError(string body)
        {
            return new Message("error", body);
        }

        public override string ToString()
        {
            return string.Format("{0}: {1}", Type, Body);
        }
    }
}
