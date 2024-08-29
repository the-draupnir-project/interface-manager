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
  Command,
  CommandDescription,
  CommandTable,
  Presentation,
  PresentationArgumentStream,
  StandardPresentationArgumentStream,
  makePartialCommand,
} from "../Command";
import {
  StringPresentationType,
  TextPresentationRenderer,
  readCommand,
} from "../TextReader";

export interface MatrixInterfaceCommandDispatcher<MatrixEventContext> {
  handleCommandMessageEvent(
    eventContext: MatrixEventContext,
    body: string
  ): void;
  handleCommandFromPresentationStream(
    eventContext: MatrixEventContext,
    stream: PresentationArgumentStream
  ): void;
}

export type CommandFailedCB<AdaptorContext, MatrixEventContext> = (
  adaptorContext: AdaptorContext,
  eventContext: MatrixEventContext,
  command: Command,
  error: ResultError
) => void;
export type CommandUncaughtErrorCB<AdaptorContext, MatrixEventContext> = (
  AdaptorContext: AdaptorContext,
  eventContext: MatrixEventContext,
  commandBody: string,
  error: Error
) => void;
export type CommandPrefixExtractor = (body: string) => string | undefined;
export type LogCurentCommandCB<AdaptorContext, MatrixEventContext> = (
  adaptorContext: AdaptorContext,
  eventContext: MatrixEventContext,
  commandParts: Presentation[]
) => void;

export class StandardMatrixInterfaceCommandDispatcher<
  AdaptorContext,
  MatrixEventContext,
> implements MatrixInterfaceCommandDispatcher<MatrixEventContext>
{
  public constructor(
    private readonly interfaceAdaptor: MatrixInterfaceAdaptor<
      AdaptorContext,
      MatrixEventContext
    >,
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
    >,
    private readonly logCurentCommandCB: LogCurentCommandCB<
      AdaptorContext,
      MatrixEventContext
    >
  ) {
    // nothing to do.
  }

  handleCommandFromPresentationStream(
    eventContext: MatrixEventContext,
    stream: PresentationArgumentStream
  ): void {
    try {
      this.logCurentCommandCB(this.adaptorContext, eventContext, stream.source);
      const commandToUse =
        this.comandTable.findAMatchingCommand(stream) ?? this.helpCommand;
      const normalisedDesignator = stream.source
        .slice(0, stream.getPosition())
        .map((p) => p.object) as string[];
      const partialCommand = makePartialCommand(
        stream,
        commandToUse,
        normalisedDesignator
      );
      void this.interfaceAdaptor
        .parseAndInvoke(partialCommand, this.adaptorContext, eventContext)
        .then(
          (result) => {
            if (isError(result)) {
              this.commandFailedCB(
                this.adaptorContext,
                eventContext,
                partialCommand,
                result.error
              );
            }
          },
          (error) => {
            if (error instanceof Error) {
              this.commandUncaughtErrorCB(
                this.adaptorContext,
                eventContext,
                stream.source
                  .map((p) => TextPresentationRenderer.render(p))
                  .join(" "),
                error
              );
            } else {
              throw new TypeError(
                `Something is throwing things that are not errors ${error}`
              );
            }
          }
        );
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.commandUncaughtErrorCB(
          this.adaptorContext,
          eventContext,
          stream.source
            .map((p) => TextPresentationRenderer.render(p))
            .join(" "),
          error
        );
      } else {
        throw new TypeError(
          // I don't know what else we're going to do with it...
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `Something is throwing things that are not errors ${error})}`
        );
      }
    }
  }

  handleCommandMessageEvent(
    eventContext: MatrixEventContext,
    body: string
  ): void {
    try {
      const readResult = readCommand(body);
      const firstItem = readResult.at(0);
      if (firstItem === undefined || typeof firstItem.object !== "string") {
        return;
      }
      const prefix = this.prefixExtractor(firstItem.object);
      if (prefix === undefined) {
        return; // This message in reality probably is not a command.
      }
      const normalisedCommand = [
        StringPresentationType.wrap(prefix),
        ...readResult.slice(1),
      ];
      this.handleCommandFromPresentationStream(
        eventContext,
        new StandardPresentationArgumentStream(normalisedCommand)
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.commandUncaughtErrorCB(
          this.adaptorContext,
          eventContext,
          body,
          error
        );
      } else {
        throw new TypeError(
          // I don't know what else we're going to do with it...
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `Something is throwing things that are not errors ${error})}`
        );
      }
    }
  }
}
