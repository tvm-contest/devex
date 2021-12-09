import {
  ColumnOptions,
  ObjectIdColumn as typeormObjectIdColumn,
} from "typeorm";
import { Transform } from "class-transformer";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const StringObjectIdColumn = (
  options?: ColumnOptions
): PropertyDecorator => {
  return (...args) => {
    typeormObjectIdColumn(options)(...args);
    Transform(({ value }) => value.toHexString(), { toPlainOnly: true })(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ...args
    );
  };
};
