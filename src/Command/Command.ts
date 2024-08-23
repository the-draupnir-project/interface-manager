// Copyright 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { CommandDescription } from "./CommandDescription";
import { ParsedKeywords } from "./ParsedKeywords";
import { PresentationArgumentStream } from "./PresentationStream";

type CommandBase = {
  readonly description: CommandDescription;
  // The normalised designator that was used to invoke the command.
  readonly designator: string[];
};

export type Command<
  Arguments extends unknown[] = unknown[],
  RestArguments extends unknown[] = unknown[],
> = CompleteCommand<Arguments, RestArguments> | PartialCommand;

export type CompleteCommand<
  Arguments extends unknown[] = unknown[],
  RestArguments extends unknown[] = unknown[],
> = CommandBase & {
  readonly isPartial: false;
  readonly immediateArguments: Arguments;
  readonly rest?: RestArguments[];
  readonly keywords: ParsedKeywords;
  toPartialCommand(): PartialCommand;
};

export type PartialCommand = CommandBase & {
  readonly isPartial: true;
  readonly stream: PresentationArgumentStream;
};

export function isPartialCommand(command: Command): command is PartialCommand {
  return command.isPartial;
}

export function isCompleteCommand<
  Arguments extends unknown[] = unknown[],
  RestArguments extends unknown[] = unknown[],
>(
  command: Command<Arguments, RestArguments>
): command is CompleteCommand<Arguments, RestArguments> {
  return !command.isPartial;
}

export function makePartialCommand<
  Context = unknown,
  CommandResult = unknown,
  Arguments extends unknown[] = unknown[],
>(
  stream: PresentationArgumentStream,
  commandDescription: CommandDescription<Context, CommandResult, Arguments>,
  designator: string[]
): PartialCommand {
  return {
    stream,
    isPartial: true,
    description: commandDescription as CommandDescription,
    designator,
  };
}
