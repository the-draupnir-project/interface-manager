// Copyright 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { KeywordPropertyDescription } from "./KeywordParameterDescription";
import { ParameterDescription } from "./ParameterDescription";
import { DescribeParameter } from "./ParameterParsing";

export type ParameterMeta<ExecutorContext = unknown, ObjectType = unknown> = {
  readonly context: ExecutorContext;
  readonly objectType: ObjectType;
};

export type KeywordsMeta<ExecutorContext = unknown> = {
  [keyword: string]: ParameterMeta<ExecutorContext>;
};

export type KeywordPropertyDescriptionsFromKeywordsMeta<
  TKeywordsMeta extends KeywordsMeta,
> = {
  [I in keyof TKeywordsMeta]: KeywordPropertyDescription<TKeywordsMeta[I]>;
};
export type KeywordPropertyRecordFromKeywordsMeta<
  TKeywordsMeta extends KeywordsMeta,
> = { [I in keyof TKeywordsMeta]?: TKeywordsMeta[I]["objectType"] };

export type CommandMeta<
  Context = unknown,
  InvocationInformation = unknown,
  CommandResult = unknown,
  Parameters extends ParameterMeta<Context>[] = ParameterMeta<Context>[],
  Keywords extends KeywordsMeta<Context> = KeywordsMeta<Context>,
  RestParameterMeta extends ParameterMeta<Context> = ParameterMeta<Context>,
> = {
  readonly context: Context;
  readonly invocationInformation: InvocationInformation;
  readonly commandResult: CommandResult;
  readonly parameters: Parameters;
  readonly arguments: {
    [I in keyof Parameters]: Parameters[I]["objectType"];
  };
  readonly parameterDescriptions: {
    [I in keyof Parameters]: ParameterDescription<Parameters[I]>;
  };
  readonly describeParameters: {
    [I in keyof Parameters]: DescribeParameter<Parameters[I]>;
  };
  readonly restParameter: RestParameterMeta;
  readonly restArguments: RestParameterMeta["objectType"][];
  readonly keywords: Keywords;
  readonly keywordDescriptions: KeywordPropertyDescriptionsFromKeywordsMeta<Keywords>;
};
