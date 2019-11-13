import { DataProxy } from "apollo-cache";
import gql from "graphql-tag";
import { FetchResult } from "react-apollo";
import { createTypedGraphqlHoc, IGraphqlType } from "../typedGraphql";

const importCSVDataMutation = gql`
  mutation importCSVDataMutation($files: [Upload]!) {
    success: importCSVData(files: $files)
  }
`;

interface IImportCSVDataMutationResponse extends IGraphqlType {
  readonly success?: boolean;
}

interface IImportCSVDataMutationVariables {
  readonly files: File[];
}

export interface IImportCSVDataMutationHocProps {
  readonly importCSVData: (
    variables: IImportCSVDataMutationVariables
  ) => Promise<void | FetchResult<IImportCSVDataMutationResponse>>;
}

const importCSVDataTypedHoc = createTypedGraphqlHoc<
  IImportCSVDataMutationResponse,
  IImportCSVDataMutationVariables
>(importCSVDataMutation);

export const withImportCSVDataMutation = <TProps = {}>() =>
  importCSVDataTypedHoc<TProps, IImportCSVDataMutationHocProps>({
    props: ({ mutate }) => ({
      importCSVData: (variables: IImportCSVDataMutationVariables) =>
        mutate({ variables })
    })
  });
