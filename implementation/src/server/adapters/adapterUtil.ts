import {
  IAdapter,
  IAuthenticationAdapter,
  IPostgresAdapter
} from "./adapterTypes";
import { AuthenticationAdapter } from "./authentication/AuthenticationAdapter";
import { PostgresAdapter } from "./postgres/PostgresAdapter";

export interface IAdapterConfig {
  [key: string]: IAdapter;
  readonly postgres: IPostgresAdapter;
  readonly authentication: IAuthenticationAdapter;
}

export const adapters: IAdapterConfig = {
  postgres: new PostgresAdapter(),
  authentication: new AuthenticationAdapter()
};

/**
 * Function for shutting down all adapters
 */
export async function gracefullyShutdownAdapters() {
  return Promise.all(
    Object.keys(adapters).map(key => {
      if (adapters[key].isInitialized()) {
        console.log(`Triggering shutdown for ${key} adapter`);
        return adapters[key].shutdown();
      }
    })
  );
}
