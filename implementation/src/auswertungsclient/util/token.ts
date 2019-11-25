const authTokenKey = 'authToken';
export const readToken = (): string => window.localStorage[authTokenKey];
export const writeToken = (authToken: string) => window.localStorage[authTokenKey] = authToken;