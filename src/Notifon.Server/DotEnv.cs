using System;
using System.IO;

namespace Notifon.Server {
    public static class DotEnv {
        private const int MaxNestingLevel = 20;

        public static void Load() {
            var envPath = AppContext.BaseDirectory;
            var envFile = Path.Combine(envPath, ".env");
            var rootPath = Path.GetPathRoot(envPath);
            for (var i = 0; !File.Exists(envFile) && rootPath != envPath && i <= MaxNestingLevel; i++) {
                envPath = Path.GetFullPath(Path.Combine(envPath, ".."));
                envFile = Path.Combine(envPath, ".env");
            }

            if (!File.Exists(envFile)) return;

            foreach (var line in File.ReadAllLines(envFile)) {
                var parts = line.Split(
                    '=',
                    StringSplitOptions.RemoveEmptyEntries);

                if (parts.Length != 2)
                    continue;

                Environment.SetEnvironmentVariable(parts[0], parts[1]);
            }
        }
    }
}