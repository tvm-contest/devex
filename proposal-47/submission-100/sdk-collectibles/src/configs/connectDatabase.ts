import { Connection, createConnection, useContainer } from 'typeorm';
import { entities } from "../db";
import { Container } from "typedi";

export const connectDatabase = async (): Promise<Connection> => {
  const { MONGODB_URL_SDK } = process.env;

  useContainer(Container);

  return await createConnection({
    type: 'mongodb',
    url: MONGODB_URL_SDK,
    synchronize: false,
    entities: [...entities],
  });
};
