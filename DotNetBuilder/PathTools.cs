using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;

namespace MicroBuildServer.DotNetBuilder
{
    static class PathTools
    {
        private const string UNC_PREFIX = "\\\\?\\";

        const int MAX_PATH = 255;

        [DllImport("kernel32.dll", CharSet = CharSet.Auto)]
        public static extern int GetShortPathName(
            [MarshalAs(UnmanagedType.LPTStr)] string path,
            [MarshalAs(UnmanagedType.LPTStr)] StringBuilder shortPath,
            int shortPathLength);

        private static string GetShortPath(string path)
        {
            var shortPath = new StringBuilder(MAX_PATH);
            GetShortPathName(path, shortPath, MAX_PATH);
            return shortPath.ToString();
        }

        private static string OptimizeDirectoryPath(string fullPath)
        {
            var uncPath = UNC_PREFIX + fullPath;
            var shortPath = GetShortPath(uncPath);
            if (shortPath.StartsWith(UNC_PREFIX))
            {
                shortPath = shortPath.Substring(UNC_PREFIX.Length);
            }
            return shortPath;
        }
        
        public static string OptimizePath(string rawPath)
        {
            //Console.WriteLine(rawPath);
            var fullPath = Path.GetFullPath(new Uri(rawPath).LocalPath);
            string result;
            if (Directory.Exists(fullPath))
            {
                result = OptimizeDirectoryPath(fullPath);
            }
            else
            {
                var directoryPath = Path.GetDirectoryName(fullPath);
                var optimizedDirectoryPath = OptimizeDirectoryPath(directoryPath);
                result = Path.Combine(optimizedDirectoryPath, Path.GetFileName(fullPath));
            }
            //Console.WriteLine(result);
            return result;
        }
    }
}
