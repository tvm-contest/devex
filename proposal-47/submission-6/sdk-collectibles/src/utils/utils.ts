let isProd = false;

export function setProduction(): void {
  isProd = true;
}

export function isProduction(): boolean {
  return isProd;
}

export function getTimeHumanReadable(mstime: number): string {
  const date = new Date(mstime);

  const hours = "0" + date.getHours();
  const minutes = "0" + date.getMinutes();
  const seconds = "0" + date.getSeconds();

  return hours.substr(-2) + ":" + minutes.substr(-2) + ":" + seconds.substr(-2);
}

export function getDateHumanReadable(mstime: number): string {
  const date = new Date(mstime);

  const day = "0" + date.getDate();
  const month = "0" + (date.getMonth() + 1);
  const year = date.getFullYear();

  return day.substr(-2) + "." + month.substr(-2) + "." + year;
}

export function getMergedObjects<T>(
  source: Record<string, any>,
  target: Record<string, any>
): T {
  const result: { [key: string]: any; } = {};

  for (const i in source) {
    if (i in target) {
      if (typeof source[i] !== typeof target[i]) {
        throw new Error("Merging failed, incompatible types for key: " + i);
      }

      if (typeof source[i] === "object" && !Array.isArray(source[i])) {
        result[i] = getMergedObjects<T>(source[i], target[i]);
      } else {
        result[i] = target[i];
      }
    } else {
      result[i] = source[i];
    }
  }

  for (const i in target) {
    if (!(i in source)) {
      result[i] = target[i];
    }
  }

  return <T>result;
}

export function isStruct(data: unknown): data is Record<string, unknown> {
  return typeof data === "object" && data != null;
}