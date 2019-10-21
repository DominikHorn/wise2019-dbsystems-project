import { IAuthenticationAdapter } from "../adapterTypes";

// tokenStore stores token/user id combinations
const tokenStore = new Map<string, number>();


export class AuthenticationAdapter implements IAuthenticationAdapter {
  private initialized: boolean;
  public isInitialized = () => this.initialized;

  // Nothing to do
  public initialize = async (): Promise<boolean> => {
    this.initialized = true;
    return this.initialized;
  };

  // Nothing to do
  public shutdown = async (): Promise<boolean> => {
    this.initialized = false;
    return this.initialized;
  };


  public clearToken = async (token: string): Promise<boolean> =>
    tokenStore.delete(token);

  public loginUser = async (
      ): Promise<string> => {
        return "ASDF";
    // const userId = await getUserIdForEmail(email);

    // // Prevent brute force by waiting based on previous attempts
    // const attemptCounter = attemptCounterMap[context.userIp] || 0;
    // attemptCounterMap[context.userIp] = attemptCounter + 1;
    // const exponentialWrongAttemptSleep = async () => {
    //   if (attemptCounter > 2) {
    //     console.log(
    //       "Wrong authentication attempt",
    //       attemptCounter + 1,
    //       "from ip address:",
    //       context.userIp
    //     );
    //   }
    //   await sleep(2000 * attemptCounter * attemptCounter);
    // };

    // // No user was found with that email
    // if (!userId) {
    //   await exponentialWrongAttemptSleep();
    //   throw new AuthenticationError("Authentication failed");
    // }

    // // Load and compare password
    // if (!(await verifyUserPassword(userId, password))) {
    //   await exponentialWrongAttemptSleep();
    //   throw new AuthenticationError("Authentication failed");
    // }

    // // Reset attemptCounter
    // attemptCounterMap[context.userIp] = 0;

    // // Generate and return new user token
    // const token = this.generateToken();
    // tokenStore.set(token, userId);
    // return token;
  };

  public isTokenValid = async (token: string): Promise<boolean> =>
    !!tokenStore.get(token);

  public getUserIdForToken = async (token: string): Promise<number> => {
    const userId = tokenStore.get(token);

    // Token is not mapped to userid
    if (!userId) return null;

    // return the userid
    return userId;
  };
}
