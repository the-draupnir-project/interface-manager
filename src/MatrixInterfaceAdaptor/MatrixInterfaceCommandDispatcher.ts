// SPDX-FileCopyrightText: 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { ResultError, isError } from "@gnuxie/typescript-result";
import { MatrixInterfaceAdaptor } from "./MatrixInterfaceAdaptor";
import {
  CommandDescription,
  CommandTable,
  StandardPresentationArgumentStream,
} from "../Command";
import { makeStringPresentation, readCommand } from "../TextReader";

export interface MatrixInterfaceCommandDispatcher<MatrixEventContext> {
  handleCommandMessageEvent(
    eventContext: MatrixEventContext,
    body: string
  ): void;
}

export type CommandFailedCB<AdaptorContext, MatrixEventContext> = (
  adaptorContext: AdaptorContext,
  eventContext: MatrixEventContext,
  error: ResultError
) => void;
export type CommandUncaughtErrorCB<AdaptorContext, MatrixEventContext> = (
  AdaptorContext: AdaptorContext,
  eventContext: MatrixEventContext,
  error: Error
) => void;
export type CommandPrefixExtractor = (body: string) => string | undefined;

export class StandardMatrixInterfaceCommandDispatcher<
  AdaptorContext,
  MatrixEventContext,
> implements MatrixInterfaceCommandDispatcher<MatrixEventContext>
{
  public constructor(
    private readonly interfaceAdaptor: MatrixInterfaceAdaptor<MatrixEventContext>,
    private readonly adaptorContext: AdaptorContext,
    private readonly comandTable: CommandTable,
    private readonly helpCommand: CommandDescription,
    /**
     * A function to extract a command table name from the message body.
     * So for example `!draupnir` => `draupnir`, or `.joinwave` => `joinwave`,
     * or even`@draupnir:example.com:` => `draupnir`.
     */
    private readonly prefixExtractor: CommandPrefixExtractor,
    /**
     * A callback to handle commands returning an error result.
     * Used for logging usually.
     */
    private readonly commandFailedCB: CommandFailedCB<
      AdaptorContext,
      MatrixEventContext
    >,
    /**
     * A callback to handle any uncaught JS `Error`s that were thrown
     * while handling a command.
     */
    private readonly commandUncaughtErrorCB: CommandUncaughtErrorCB<
      AdaptorContext,
      MatrixEventContext
    >
  ) {
    // nothing to do.
  }

  handleCommandMessageEvent(
    eventContext: MatrixEventContext,
    body: string
  ): void {
    const readResult = readCommand(body);
    const firstItem = readResult.at(0);
    if (firstItem === undefined || typeof firstItem.object !== "string") {
      return;
    }
    const prefix = this.prefixExtractor(firstItem.object);
    if (prefix === undefined) {
      return; // This message in reality probably is not a command.
    }
    const stream = new StandardPresentationArgumentStream([
      makeStringPresentation(prefix),
      ...readResult.slice(1),
    ]);
    const commandToUse =
      this.comandTable.findAMatchingCommand(stream) ?? this.helpCommand;
    void this.interfaceAdaptor
      .parseAndInvoke(commandToUse, eventContext, stream)
      .then(
        (result) => {
          if (isError(result)) {
            this.commandFailedCB(
              this.adaptorContext,
              eventContext,
              result.error
            );
          }
        },
        (error) => {
          if (error instanceof Error) {
            this.commandUncaughtErrorCB(
              this.adaptorContext,
              eventContext,
              error
            );
          } else {
            throw new TypeError(
              `Something is throwing things that are not errors ${error}`
            );
          }
        }
      );
  }
}
