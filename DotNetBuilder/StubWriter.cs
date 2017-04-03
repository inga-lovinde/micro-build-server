using System.IO;
using System.Text;

namespace MicroBuildServer.DotNetBuilder
{
    class StubWriter : TextWriter
    {
        public override Encoding Encoding
        {
            get { return Encoding.Default; }
        }
    }
}
