/**
 * Interface for all Adapters to backend systems
 */
import { PoolClient, QueryConfig } from "pg";
import { IDatabaseEntity } from "../databaseEntities";
import { IContext } from "../graphql/resolvers";

export interface IAdapter {
  /**
   * Initializes the adapter. Returned promise signals whether
   * or not initialization worked correctly
   */
  readonly initialize: () => Promise<boolean>;

  /**
   * Whether or not the adapter is initialized
   */
  readonly isInitialized: () => boolean;

  /**
   * Shuts the adapter down. Returned promise
   * signals whether or not shutdown worked gracefully
   */
  readonly shutdown: () => Promise<boolean>;
}

/**
 * Postgres adapter capabilities
 */
export interface IPostgresAdapter extends IAdapter {
  /**
   * Wrapper for querying postgres using sql, returning mapped entities
   */
  readonly query: <T extends IDatabaseEntity>(
    queryTextOrConfig: string | QueryConfig,
    values?: any[]
  ) => Promise<T[]>;

  /**
   * wraps function in transaction. Use client object for executing sql within transaction
   */
  readonly transaction: <T>(
    callback: (client: PoolClient) => Promise<T>
  ) => Promise<T>;
}

/**
 * User adapter capabilities
 */
export interface IAuthenticationAdapter extends IAdapter {
  /**
   * This allows client to gracefully and efficiently find out whether or not a login
   * is necessary
   */
  readonly isTokenValid: (token: string) => Promise<boolean>;

  /**
   * Given a correct email and password, this function will login the user,
   * returning and authToken.
   */
  readonly loginUser: (
    email: string,
    password: string,
    context: IContext
  ) => Promise<string>;

  /**
   * Invalidates a token if it exists
   */
  readonly clearToken: (token: string) => Promise<boolean>;

  /**
   * Obtain the user for a given token
   */
  readonly getUserIdForToken: (token: string) => Promise<number>;
}
