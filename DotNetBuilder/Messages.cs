using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MicroBuildServer.DotNetBuilder
{
    internal class Messages
    {
        private readonly object syncRoot = new object();

        private readonly List<Message> storage = new List<Message>();

        public void Add(Message message)
        {
            if (message == null)
            {
                throw new ArgumentNullException(nameof(message));
            }

            lock(syncRoot)
            {
                storage.Add(message);
            }
        }

        public TResult[] ToArray<TResult>(Func<Message, TResult> selector)
        {
            lock(syncRoot)
            {
                return storage.Select(selector).ToArray();
            }
        }

        public bool Any()
        {
            lock(syncRoot)
            {
                return storage.Any();
            }
        }
    }
}
