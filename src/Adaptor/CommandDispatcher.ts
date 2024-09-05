// SPDX-FileCopyrightText: 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { Result } from "@gnuxie/typescript-result";
import {
  PartialCommand,
  Presentation,
  PresentationArgumentStream,
} from "../Command";
import { CommandInvokerCallbacks } from "./CommandInvokerCallbacks";

export type CommandPrefixExtractor = (body: string) => string | undefined;
export type LogCurentCommandCB<CommandInformation> = (
  CommandInformation: CommandInformation,
  commandParts: Presentation[]
) => void;

export interface CommandDispatcherCallbacks<CommandInformation>
  extends CommandInvokerCallbacks<CommandInformation> {
  readonly logCurrentCommandCB?:
    | LogCurentCommandCB<CommandInformation>
    | undefined;
  /**
   * A function to extract a command table name from the message body.
   * So for example `!draupnir` => `draupnir`, or `.joinwave` => `joinwave`,
   * or even`@draupnir:example.com:` => `draupnir`.
   */
  readonly prefixExtractor?: CommandPrefixExtractor | undefined;
}

export interface CommandDispatcher<CommandInformation> {
  parsePartialCommandFromBody(
    commandInformation: CommandInformation,
    body: string
  ): Result<PartialCommand>;
  parsePartialCommandFromStream(
    commandInformation: CommandInformation,
    stream: PresentationArgumentStream
  ): Result<PartialCommand>;
}
