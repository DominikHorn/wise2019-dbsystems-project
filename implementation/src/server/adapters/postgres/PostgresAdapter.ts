import { Pool, PoolClient, QueryConfig } from "pg";
import { config } from "../../config";
import { IDatabaseEntity } from "../../databaseEntities";
import { IPostgresAdapter } from "../adapterTypes";
import SETUP_POSTGRES_SQL from '../../../../postgres/setupPostgres.sql';

export class PostgresAdapter implements IPostgresAdapter {
  /** A connection pool for postgresql */
  private pool?: Pool = null;
  private initialized: boolean;
  public isInitialized = () => this.initialized;

  public initialize = async (): Promise<boolean> => {
    if (this.isInitialized()) return false;
    try {
      // Configure connection pool
      this.pool = new Pool(config.postgresConfig);

      // Setup error callback
      this.pool.on("error", (err, client) =>
        console.error(`Unexpected error '${err}' on client: ${client}`)
      );

      // Execute setupPostgres to make sure DB is initialized
      await this.query(SETUP_POSTGRES_SQL)
        .then(async () => {
      //     // Create admin user if it does not exist
      //     const users = await getAllUsers();
      //     if (!users || users.length === 0) {
      //       await createUser(
      //         "Ricardo",
      //         "Oot",
      //       );
      //     }
         this.initialized = true;
        })
        .catch(err => console.error(`Failed to initialize postgres: ${err}`));
    } catch (error) {
      this.pool = null;
      this.initialized = false;
      console.error(`Postgres adapter init failed: ${error}`);
      return false;
    }
    return true;
  };

  public shutdown = async () => {
    if (this.pool) {
      return this.pool.end().then(() => {
        this.initialized = false;
        return true;
      });
    }

    return false;
  };

  public transaction = async <T>(
    callback: (client: PoolClient) => Promise<T>
  ) => {
    const client = await this.pool.connect();
    let result: T = null;
    try {
      await client.query("BEGIN");
      result = await callback(client);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return result;
  };

  /**
   * Internal function wrapping a psql pool query
   * @param queryTextOrConfig
   * @param values
   */
  public query = async <T extends IDatabaseEntity>(
    queryTextOrConfig: string | QueryConfig,
    values?: any[]
  ): Promise<T[]> =>
    this.pool
      .query(queryTextOrConfig, values)
      .catch(err => {
        throw `Operation on postgres failed: ${err.message}\n${err.stack}`;
      })
      .then(res => res.rows);
}
