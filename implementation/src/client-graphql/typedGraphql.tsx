import { DocumentNode } from "graphql";
import * as React from "react";
import {
  DataProps,
  graphql,
  MutateProps,
  Mutation,
  MutationProps,
  OperationOption,
  Query,
  QueryProps
} from "react-apollo";

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type Diff<U, T extends U> = Omit<T, keyof U>;

export interface IGraphqlType {
  readonly __typename: string;
}

/**
 * This helper function may be used to create a typed higher order graphql component to be used
 * with the compose() functionality of react-apollo
 * @param graphqlDocument namely graphqlTag should be used as parameter
 */
export const createTypedGraphqlHoc = <TQueryResponse, TQueryVariables>(
  graphqlDocument: DocumentNode
) => <
  TProps extends TQueryVariables | {} = {},
  TChildProps = Partial<DataProps<TQueryResponse, TQueryVariables>> &
    Partial<MutateProps<TQueryResponse, TQueryVariables>>
>(
  options?: OperationOption<
    TProps,
    TQueryResponse,
    TQueryVariables,
    TChildProps
  >
) => graphql(graphqlDocument, options);

/**
 * This helper function may be used to create a typed Query Component
 * @param gqlQuery
 */
export const createTypedQuery = <TQueryResponse, TQueryVariables>(
  gqlQuery: any
) => {
  type _RemoveProps = { query: any; variables?: any };
  type _QueryProps = QueryProps<TQueryResponse, TQueryVariables>;
  type _StrippedProps = Diff<_RemoveProps, _QueryProps>;

  type _Props = {} extends TQueryVariables
    ? _StrippedProps
    : _StrippedProps & { variables: TQueryVariables };
  return class extends React.PureComponent<_Props> {
    render() {
      return <Query {...this.props} query={gqlQuery} />;
    }
  };
};

/**
 * This helper function may be used to create a typed Mutation Component
 * @param gqlMutation
 */
export const createTypedMutation = <TQueryResponse, TQueryVariables>(
  gqlMutation: any
) => {
  type _RemoveProps = {
    mutation: any;
    optimisticResponse?: any;
    variables?: any;
  };
  type _MutationProps = MutationProps<TQueryResponse, TQueryVariables>;
  type _StrippedProps = Diff<_RemoveProps, _MutationProps>;

  type _Props = {} extends TQueryVariables
    ? _StrippedProps
    : _StrippedProps & { variables: TQueryVariables };
  return class extends React.PureComponent<_Props> {
    render() {
      return <Mutation {...this.props} mutation={gqlMutation} />;
    }
  };
};
