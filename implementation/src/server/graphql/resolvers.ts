export interface IContext {
  readonly userId: Promise<number>;
  readonly userIp: string;
  readonly authToken: string;
}

export const resolvers: { [key: string]: any } = {
  Query: {
    helloWorld: () => "Hello World",
  },
  Mutation: {
    importCSVData: async (_: any, args: {files: any[]}) => (console.warn(args.files), false),
  },
};