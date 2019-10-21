import { adapters } from "../adapters/adapterUtil";
import {IDatabaseUser, DatabaseSchemaGroup} from "../databaseEntities";

export const getAllUsers = async (): Promise<IDatabaseUser[]> =>
  adapters.postgres.query<IDatabaseUser>(
    `SELECT * FROM "${DatabaseSchemaGroup}".users ORDER BY id`
  );
