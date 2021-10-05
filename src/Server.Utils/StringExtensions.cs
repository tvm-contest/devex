using System;
using System.Text;

namespace Server
{
    public static class StringExtensions
    {
        public static string ToHexString(this byte[] bytes)
        {
            return BitConverter.ToString(bytes).Replace("-", string.Empty);
        }

        public static string StringFromBase64(this string input)
        {
            return Encoding.UTF8.GetString(Convert.FromBase64String(input));
        }
    }
}