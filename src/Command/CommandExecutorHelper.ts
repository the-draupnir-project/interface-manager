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
import { CommandMeta } from "./CommandMeta";
import { DirectParsedKeywords } from "./ParsedKeywords";

export type CommandExecutorHelperOptions<TCommandMeta extends CommandMeta> = {
  info?: TCommandMeta["InvocationInformation"] | undefined;
  rest?: TCommandMeta["TRestArgumentObjectType"][] | undefined;
  keywords?: Partial<TCommandMeta["TKeywordsMeta"]> | undefined;
};

export const CommandExecutorHelper = Object.freeze({
  async execute<TCommandMeta extends CommandMeta>(
    command: CommandDescription<TCommandMeta>,
    context: TCommandMeta["Context"],
    options: CommandExecutorHelperOptions<TCommandMeta>,
    ...args: TCommandMeta["TImmediateArgumentsObjectTypes"]
  ): Promise<Result<CommandMeta["CommandResult"]>> {
    const parsedKeywords = new DirectParsedKeywords(
      command.parametersDescription.keywords,
      options.keywords ?? {}
    );
    return await command.executor(
      context as never,
      options.info ?? {},
      parsedKeywords,
      options.rest ?? [],
      ...args
    );
  },
});
