using System;
using System.Text;

namespace NotificationProvider.Functions.Extensions
{
    public static class StringExtensions
    {
        public static string Base64ToHex(this string input)
        {
            var bytes = Encoding.UTF8.GetBytes(input);
            var hexString = BitConverter.ToString(bytes);

            return hexString.Replace("-", "").ToLower();
        }

        public static string Base64ToUtf8(this string base64)
        {
            var str = Convert.FromBase64String(base64);

            return Encoding.UTF8.GetString(str);
        }
    }
}
