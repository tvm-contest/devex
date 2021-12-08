export const generateId = (root: string, id: string) => {
  return `${root}__${id}`;
};

export const generateTokenId = (series: string, id: string) => {
  return `${series}-${id}`;
};

