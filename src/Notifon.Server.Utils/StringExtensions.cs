using System;
using System.Linq;
using System.Text;

namespace Notifon.Server.Utils {
    public static class StringExtensions {
        public static string ToHexString(this byte[] bytes) {
            return BitConverter.ToString(bytes).Replace("-", string.Empty);
        }

        public static string StringFromBase64(this string input) {
            return Encoding.UTF8.GetString(Convert.FromBase64String(input));
        }

        public static string HexToString(this string input) {
            var bb = Enumerable.Range(0, input.Length)
                .Where(x => x % 2 == 0)
                .Select(x => Convert.ToByte(input.Substring(x, 2), 16))
                .ToArray();
            return Encoding.UTF8.GetString(bb);
        }
    }
}