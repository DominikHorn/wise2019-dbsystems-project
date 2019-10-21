declare module "*.graphql" {
  const content: { loc: { source: { body: string } } };
  export default content;
}
