export const generatePoints = (files: { hash: string; weight: number; }[]) => {
  const divider = files.reduce(add, 0);
  const sections = files.map((item) => {
    return {
      hash: item.hash,
      section: item.weight / divider
    };
  });

  const points: { hash?: string; point: number; }[] = [{ point: 0 }];
  sections.forEach((item, key, arr) => {
    if (!arr[key + 1]){
      points[key + 1] = { point: 1, hash: item.hash };
    } else {
      points[key + 1] = { point: item.section +(points[key]?.point || 0), hash: item.hash };
    }
  });
  return points;
};

const add = (acc: number, a: { hash: string; weight: number; }) => {
  return acc + a.weight;
};
