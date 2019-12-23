import gql from "graphql-tag";
import { FetchResult } from "react-apollo";
import { createTypedGraphqlHoc, IGraphqlType } from "../typedGraphql";
import { MutationToImportCSVDataArgs } from "../../shared/graphql.types";

const importCSVDataMutation = gql`
  mutation importCSVDataMutation(
    $wahlleiterAuth: String!
    $files: [Upload]!
    $wahldatum: Date!
    $aggregiert: Boolean!
  ) {
    success: importCSVData(
      wahlleiterAuth: $wahlleiterAuth
      files: $files
      wahldatum: $wahldatum
      aggregiert: $aggregiert
    )
  }
`;

interface IImportCSVDataMutationResponse extends IGraphqlType {
  readonly success?: boolean;
}
export interface IImportCSVDataMutationHocProps {
  readonly importCSVData: (
    variables: MutationToImportCSVDataArgs
  ) => Promise<void | FetchResult<IImportCSVDataMutationResponse>>;
}

const importCSVDataTypedHoc = createTypedGraphqlHoc<
  IImportCSVDataMutationResponse,
  MutationToImportCSVDataArgs
>(importCSVDataMutation);

export const withImportCSVDataMutation = <TProps = {}>() =>
  importCSVDataTypedHoc<TProps, IImportCSVDataMutationHocProps>({
    props: ({ mutate }) => ({
      importCSVData: (variables: MutationToImportCSVDataArgs) =>
        mutate({ variables })
    })
  });
