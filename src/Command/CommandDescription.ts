// Copyright 2022 Gnuxie <Gnuxie@protonmail.com>
// Copyright 2022 The Matrix.org Foundation C.I.C.
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from mjolnir
// https://github.com/matrix-org/mjolnir
// </text>
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { Result } from "@gnuxie/typescript-result";
import { ParsedKeywords } from "./ParsedKeywords";
import {
  CommandParametersDescription,
  ParameterDescriptionsFromArguments,
} from "./ParameterParsing";

export type CommandExecutorFunction<
  Context = unknown,
  TInvocationInformation = unknown,
  CommandResult = unknown,
  Arguments extends unknown[] = unknown[],
> = (
  // The context needs to be specific to each command, and we need to add context glue
  // that can attenuate them.
  context: Context,
  invocationInformation: TInvocationInformation,
  keywords: ParsedKeywords,
  ...args: Arguments
) => Promise<Result<CommandResult>>;

export interface CommandDescription<
  Context = unknown,
  TInvocationInformation = unknown,
  CommandResult = unknown,
  Arguments extends unknown[] = unknown[],
> {
  readonly executor: CommandExecutorFunction<
    Context,
    TInvocationInformation,
    CommandResult,
    Arguments
  >;
  /** A short one line summary of what the command does to display alongside it's help */
  readonly summary: string;
  /** A longer description that goes into detail. */
  readonly description?: string | undefined;
  readonly parametersDescription: CommandParametersDescription<
    ParameterDescriptionsFromArguments<Arguments>
  >;
}

export type ExtractCommandResult<TCommandDescription> =
  TCommandDescription extends CommandDescription<
    unknown,
    unknown,
    infer CommandResult
  >
    ? CommandResult
    : never;
