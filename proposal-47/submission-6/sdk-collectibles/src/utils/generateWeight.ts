import { ImageDto } from "../db";

export const generateWeight = (images: ImageDto[]): { hash: string; weight: number; }[] => {
  return images.map(item => {
    return {
      hash: item.hash,
      weight: list[item.rarity] as number
    };
  });
};

const list: number[] = [6, 4, 2.5, 1.5, 1, .8, .6, .4, .3, .2];
