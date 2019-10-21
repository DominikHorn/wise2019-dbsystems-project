export interface IContext {
  readonly userId: Promise<number>;
  readonly userIp: string;
  readonly authToken: string;
}

export const resolvers: { [key: string]: any } = {
  Query: {
    helloWorld: () => "Hello World!",
  },
  // Mutation: {}
};