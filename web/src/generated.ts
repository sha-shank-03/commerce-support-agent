/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { type GraphQLClient, type RequestOptions } from 'graphql-request';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type ActionReceipt = {
  __typename?: 'ActionReceipt';
  at?: Maybe<Scalars['String']['output']>;
  detail?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  kind?: Maybe<Scalars['String']['output']>;
  simulated?: Maybe<Scalars['Boolean']['output']>;
};

export type Evidence = {
  __typename?: 'Evidence';
  content?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  approveRun?: Maybe<Run>;
  cancelRun?: Maybe<Run>;
  clarifyRun?: Maybe<Run>;
  rejectRun?: Maybe<Run>;
  resumeRun?: Maybe<Run>;
  startRun?: Maybe<Run>;
};


export type MutationApproveRunArgs = {
  digest?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  text?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCancelRunArgs = {
  digest?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  text?: InputMaybe<Scalars['String']['input']>;
};


export type MutationClarifyRunArgs = {
  digest?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  text?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRejectRunArgs = {
  digest?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  text?: InputMaybe<Scalars['String']['input']>;
};


export type MutationResumeRunArgs = {
  digest?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  text?: InputMaybe<Scalars['String']['input']>;
};


export type MutationStartRunArgs = {
  ticketId: Scalars['String']['input'];
};

export type Order = {
  __typename?: 'Order';
  address?: Maybe<Scalars['String']['output']>;
  currency?: Maybe<Scalars['String']['output']>;
  damaged?: Maybe<Scalars['Boolean']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  totalMinor?: Maybe<Scalars['Int']['output']>;
  version?: Maybe<Scalars['Int']['output']>;
};

export type ProposedAction = {
  __typename?: 'ProposedAction';
  address?: Maybe<Scalars['String']['output']>;
  amountMinor?: Maybe<Scalars['Int']['output']>;
  digest?: Maybe<Scalars['String']['output']>;
  expires?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  kind?: Maybe<Scalars['String']['output']>;
  orderId?: Maybe<Scalars['String']['output']>;
  orderVersion?: Maybe<Scalars['Int']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  run?: Maybe<Run>;
  runEvents?: Maybe<Array<Maybe<RunEvent>>>;
  runs?: Maybe<Array<Maybe<Run>>>;
  tickets?: Maybe<Array<Maybe<Ticket>>>;
};


export type QueryRunArgs = {
  id: Scalars['String']['input'];
};


export type QueryRunEventsArgs = {
  after?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['String']['input'];
};

export type Run = {
  __typename?: 'Run';
  created?: Maybe<Scalars['Float']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  events?: Maybe<Array<Maybe<RunEvent>>>;
  evidence?: Maybe<Array<Maybe<Evidence>>>;
  id?: Maybe<Scalars['String']['output']>;
  inputTokens?: Maybe<Scalars['Int']['output']>;
  model?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Order>;
  outputTokens?: Maybe<Scalars['Int']['output']>;
  promptVersion?: Maybe<Scalars['String']['output']>;
  proposal?: Maybe<ProposedAction>;
  receipt?: Maybe<ActionReceipt>;
  state?: Maybe<Scalars['String']['output']>;
  summary?: Maybe<Scalars['String']['output']>;
  ticket?: Maybe<Ticket>;
  turns?: Maybe<Scalars['Int']['output']>;
  usedMicros?: Maybe<Scalars['Int']['output']>;
};

export type RunEvent = {
  __typename?: 'RunEvent';
  at?: Maybe<Scalars['String']['output']>;
  detail?: Maybe<Scalars['String']['output']>;
  kind?: Maybe<Scalars['String']['output']>;
  seq?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type Ticket = {
  __typename?: 'Ticket';
  id?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  orderId?: Maybe<Scalars['String']['output']>;
  scenario?: Maybe<Scalars['String']['output']>;
  subject?: Maybe<Scalars['String']['output']>;
};

export type RunDetailsFragment = { id: string | null, state: string | null, summary: string | null, error: string | null, model: string | null, promptVersion: string | null, turns: number | null, usedMicros: number | null, inputTokens: number | null, outputTokens: number | null, ticket: { id: string | null, subject: string | null, message: string | null, orderId: string | null, scenario: string | null } | null, order: { id: string | null, status: string | null, totalMinor: number | null, currency: string | null, address: string | null, version: number | null } | null, events: Array<{ seq: number | null, kind: string | null, title: string | null, detail: string | null, at: string | null } | null> | null, evidence: Array<{ id: string | null, title: string | null, content: string | null, version: string | null } | null> | null, proposal: { id: string | null, kind: string | null, digest: string | null, amountMinor: number | null, address: string | null, reason: string | null, expires: number | null } | null, receipt: { id: string | null, detail: string | null, simulated: boolean | null } | null };

export type TicketsQueryVariables = Exact<{ [key: string]: never; }>;


export type TicketsQuery = { tickets: Array<{ id: string | null, subject: string | null, message: string | null, orderId: string | null, scenario: string | null } | null> | null };

export type GetRunQueryVariables = Exact<{
  id: string;
}>;


export type GetRunQuery = { run: { id: string | null, state: string | null, summary: string | null, error: string | null, model: string | null, promptVersion: string | null, turns: number | null, usedMicros: number | null, inputTokens: number | null, outputTokens: number | null, ticket: { id: string | null, subject: string | null, message: string | null, orderId: string | null, scenario: string | null } | null, order: { id: string | null, status: string | null, totalMinor: number | null, currency: string | null, address: string | null, version: number | null } | null, events: Array<{ seq: number | null, kind: string | null, title: string | null, detail: string | null, at: string | null } | null> | null, evidence: Array<{ id: string | null, title: string | null, content: string | null, version: string | null } | null> | null, proposal: { id: string | null, kind: string | null, digest: string | null, amountMinor: number | null, address: string | null, reason: string | null, expires: number | null } | null, receipt: { id: string | null, detail: string | null, simulated: boolean | null } | null } | null };

export type GetRunsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetRunsQuery = { runs: Array<{ id: string | null, state: string | null, summary: string | null, error: string | null, model: string | null, promptVersion: string | null, turns: number | null, usedMicros: number | null, inputTokens: number | null, outputTokens: number | null, ticket: { id: string | null, subject: string | null, message: string | null, orderId: string | null, scenario: string | null } | null, order: { id: string | null, status: string | null, totalMinor: number | null, currency: string | null, address: string | null, version: number | null } | null, events: Array<{ seq: number | null, kind: string | null, title: string | null, detail: string | null, at: string | null } | null> | null, evidence: Array<{ id: string | null, title: string | null, content: string | null, version: string | null } | null> | null, proposal: { id: string | null, kind: string | null, digest: string | null, amountMinor: number | null, address: string | null, reason: string | null, expires: number | null } | null, receipt: { id: string | null, detail: string | null, simulated: boolean | null } | null } | null> | null };

export type StartRunMutationVariables = Exact<{
  id: string;
}>;


export type StartRunMutation = { startRun: { id: string | null, state: string | null, summary: string | null, error: string | null, model: string | null, promptVersion: string | null, turns: number | null, usedMicros: number | null, inputTokens: number | null, outputTokens: number | null, ticket: { id: string | null, subject: string | null, message: string | null, orderId: string | null, scenario: string | null } | null, order: { id: string | null, status: string | null, totalMinor: number | null, currency: string | null, address: string | null, version: number | null } | null, events: Array<{ seq: number | null, kind: string | null, title: string | null, detail: string | null, at: string | null } | null> | null, evidence: Array<{ id: string | null, title: string | null, content: string | null, version: string | null } | null> | null, proposal: { id: string | null, kind: string | null, digest: string | null, amountMinor: number | null, address: string | null, reason: string | null, expires: number | null } | null, receipt: { id: string | null, detail: string | null, simulated: boolean | null } | null } | null };

export type ApproveMutationVariables = Exact<{
  id: string;
  text: string;
  digest: string;
}>;


export type ApproveMutation = { approveRun: { id: string | null, state: string | null, summary: string | null, error: string | null, model: string | null, promptVersion: string | null, turns: number | null, usedMicros: number | null, inputTokens: number | null, outputTokens: number | null, ticket: { id: string | null, subject: string | null, message: string | null, orderId: string | null, scenario: string | null } | null, order: { id: string | null, status: string | null, totalMinor: number | null, currency: string | null, address: string | null, version: number | null } | null, events: Array<{ seq: number | null, kind: string | null, title: string | null, detail: string | null, at: string | null } | null> | null, evidence: Array<{ id: string | null, title: string | null, content: string | null, version: string | null } | null> | null, proposal: { id: string | null, kind: string | null, digest: string | null, amountMinor: number | null, address: string | null, reason: string | null, expires: number | null } | null, receipt: { id: string | null, detail: string | null, simulated: boolean | null } | null } | null };

export type RejectMutationVariables = Exact<{
  id: string;
  text: string;
  digest: string;
}>;


export type RejectMutation = { rejectRun: { id: string | null, state: string | null, summary: string | null, error: string | null, model: string | null, promptVersion: string | null, turns: number | null, usedMicros: number | null, inputTokens: number | null, outputTokens: number | null, ticket: { id: string | null, subject: string | null, message: string | null, orderId: string | null, scenario: string | null } | null, order: { id: string | null, status: string | null, totalMinor: number | null, currency: string | null, address: string | null, version: number | null } | null, events: Array<{ seq: number | null, kind: string | null, title: string | null, detail: string | null, at: string | null } | null> | null, evidence: Array<{ id: string | null, title: string | null, content: string | null, version: string | null } | null> | null, proposal: { id: string | null, kind: string | null, digest: string | null, amountMinor: number | null, address: string | null, reason: string | null, expires: number | null } | null, receipt: { id: string | null, detail: string | null, simulated: boolean | null } | null } | null };

export type ClarifyMutationVariables = Exact<{
  id: string;
  text: string;
  digest: string;
}>;


export type ClarifyMutation = { clarifyRun: { id: string | null, state: string | null, summary: string | null, error: string | null, model: string | null, promptVersion: string | null, turns: number | null, usedMicros: number | null, inputTokens: number | null, outputTokens: number | null, ticket: { id: string | null, subject: string | null, message: string | null, orderId: string | null, scenario: string | null } | null, order: { id: string | null, status: string | null, totalMinor: number | null, currency: string | null, address: string | null, version: number | null } | null, events: Array<{ seq: number | null, kind: string | null, title: string | null, detail: string | null, at: string | null } | null> | null, evidence: Array<{ id: string | null, title: string | null, content: string | null, version: string | null } | null> | null, proposal: { id: string | null, kind: string | null, digest: string | null, amountMinor: number | null, address: string | null, reason: string | null, expires: number | null } | null, receipt: { id: string | null, detail: string | null, simulated: boolean | null } | null } | null };

export type CancelMutationVariables = Exact<{
  id: string;
  text: string;
  digest: string;
}>;


export type CancelMutation = { cancelRun: { id: string | null, state: string | null, summary: string | null, error: string | null, model: string | null, promptVersion: string | null, turns: number | null, usedMicros: number | null, inputTokens: number | null, outputTokens: number | null, ticket: { id: string | null, subject: string | null, message: string | null, orderId: string | null, scenario: string | null } | null, order: { id: string | null, status: string | null, totalMinor: number | null, currency: string | null, address: string | null, version: number | null } | null, events: Array<{ seq: number | null, kind: string | null, title: string | null, detail: string | null, at: string | null } | null> | null, evidence: Array<{ id: string | null, title: string | null, content: string | null, version: string | null } | null> | null, proposal: { id: string | null, kind: string | null, digest: string | null, amountMinor: number | null, address: string | null, reason: string | null, expires: number | null } | null, receipt: { id: string | null, detail: string | null, simulated: boolean | null } | null } | null };

export type ResumeMutationVariables = Exact<{
  id: string;
  text: string;
  digest: string;
}>;


export type ResumeMutation = { resumeRun: { id: string | null, state: string | null, summary: string | null, error: string | null, model: string | null, promptVersion: string | null, turns: number | null, usedMicros: number | null, inputTokens: number | null, outputTokens: number | null, ticket: { id: string | null, subject: string | null, message: string | null, orderId: string | null, scenario: string | null } | null, order: { id: string | null, status: string | null, totalMinor: number | null, currency: string | null, address: string | null, version: number | null } | null, events: Array<{ seq: number | null, kind: string | null, title: string | null, detail: string | null, at: string | null } | null> | null, evidence: Array<{ id: string | null, title: string | null, content: string | null, version: string | null } | null> | null, proposal: { id: string | null, kind: string | null, digest: string | null, amountMinor: number | null, address: string | null, reason: string | null, expires: number | null } | null, receipt: { id: string | null, detail: string | null, simulated: boolean | null } | null } | null };

export const RunDetailsFragmentDoc = gql`
    fragment RunDetails on Run {
  id
  state
  summary
  error
  model
  promptVersion
  turns
  usedMicros
  inputTokens
  outputTokens
  ticket {
    id
    subject
    message
    orderId
    scenario
  }
  order {
    id
    status
    totalMinor
    currency
    address
    version
  }
  events {
    seq
    kind
    title
    detail
    at
  }
  evidence {
    id
    title
    content
    version
  }
  proposal {
    id
    kind
    digest
    amountMinor
    address
    reason
    expires
  }
  receipt {
    id
    detail
    simulated
  }
}
    `;
export const TicketsDocument = gql`
    query Tickets {
  tickets {
    id
    subject
    message
    orderId
    scenario
  }
}
    `;
export const GetRunDocument = gql`
    query GetRun($id: String!) {
  run(id: $id) {
    ...RunDetails
  }
}
    ${RunDetailsFragmentDoc}`;
export const GetRunsDocument = gql`
    query GetRuns {
  runs {
    ...RunDetails
  }
}
    ${RunDetailsFragmentDoc}`;
export const StartRunDocument = gql`
    mutation StartRun($id: String!) {
  startRun(ticketId: $id) {
    ...RunDetails
  }
}
    ${RunDetailsFragmentDoc}`;
export const ApproveDocument = gql`
    mutation Approve($id: String!, $text: String!, $digest: String!) {
  approveRun(id: $id, text: $text, digest: $digest) {
    ...RunDetails
  }
}
    ${RunDetailsFragmentDoc}`;
export const RejectDocument = gql`
    mutation Reject($id: String!, $text: String!, $digest: String!) {
  rejectRun(id: $id, text: $text, digest: $digest) {
    ...RunDetails
  }
}
    ${RunDetailsFragmentDoc}`;
export const ClarifyDocument = gql`
    mutation Clarify($id: String!, $text: String!, $digest: String!) {
  clarifyRun(id: $id, text: $text, digest: $digest) {
    ...RunDetails
  }
}
    ${RunDetailsFragmentDoc}`;
export const CancelDocument = gql`
    mutation Cancel($id: String!, $text: String!, $digest: String!) {
  cancelRun(id: $id, text: $text, digest: $digest) {
    ...RunDetails
  }
}
    ${RunDetailsFragmentDoc}`;
export const ResumeDocument = gql`
    mutation Resume($id: String!, $text: String!, $digest: String!) {
  resumeRun(id: $id, text: $text, digest: $digest) {
    ...RunDetails
  }
}
    ${RunDetailsFragmentDoc}`;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    Tickets(variables?: TicketsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<TicketsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<TicketsQuery>({ document: TicketsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Tickets', 'query', variables);
    },
    GetRun(variables: GetRunQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetRunQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRunQuery>({ document: GetRunDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetRun', 'query', variables);
    },
    GetRuns(variables?: GetRunsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetRunsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRunsQuery>({ document: GetRunsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetRuns', 'query', variables);
    },
    StartRun(variables: StartRunMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<StartRunMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<StartRunMutation>({ document: StartRunDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'StartRun', 'mutation', variables);
    },
    Approve(variables: ApproveMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ApproveMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ApproveMutation>({ document: ApproveDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Approve', 'mutation', variables);
    },
    Reject(variables: RejectMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<RejectMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RejectMutation>({ document: RejectDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Reject', 'mutation', variables);
    },
    Clarify(variables: ClarifyMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ClarifyMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ClarifyMutation>({ document: ClarifyDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Clarify', 'mutation', variables);
    },
    Cancel(variables: CancelMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CancelMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CancelMutation>({ document: CancelDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Cancel', 'mutation', variables);
    },
    Resume(variables: ResumeMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ResumeMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ResumeMutation>({ document: ResumeDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Resume', 'mutation', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;