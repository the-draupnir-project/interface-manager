// Copyright 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { Result } from "@gnuxie/typescript-result";
import { CommandDescription } from "./CommandDescription";
import { CommandMeta, KeywordsMeta } from "./CommandMeta";
import { DirectParsedKeywords } from "./ParsedKeywords";

export type CommandExecutorHelperOptions<
  TInvocationInformation,
  TRestArgumentObjectType,
  TKeywordsMeta extends KeywordsMeta,
> = {
  info?: TInvocationInformation | undefined;
  rest?: TRestArgumentObjectType[] | undefined;
  keywords?: Partial<TKeywordsMeta> | undefined;
};

export const CommandExecutorHelper = Object.freeze({
  async execute<
    TCommandContext,
    TInvocationInformation,
    TCommandResult,
    TImmediateArgumentsObjectTypes extends unknown[],
    TRestArgumentObjectType,
    TKeywordsMeta extends KeywordsMeta,
  >(
    command: CommandDescription<
      CommandMeta<
        TCommandContext,
        TInvocationInformation,
        TCommandResult,
        TImmediateArgumentsObjectTypes,
        TRestArgumentObjectType,
        TKeywordsMeta
      >
    >,
    context: TCommandContext,
    options: CommandExecutorHelperOptions<
      TInvocationInformation,
      TRestArgumentObjectType,
      TKeywordsMeta
    >,
    ...args: TImmediateArgumentsObjectTypes
  ): Promise<Result<TCommandResult>> {
    const parsedKeywords = new DirectParsedKeywords(
      command.parametersDescription.keywords,
      options.keywords ?? {}
    );
    return await command.executor(
      context as never,
      options.info ?? ({} as TInvocationInformation),
      parsedKeywords,
      options.rest ?? [],
      ...args
    );
  },
});
