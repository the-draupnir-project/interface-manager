// SPDX-FileCopyrightText: 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import {
  CommandDescription,
  CommandTable,
  PartialCommand,
  makePartialCommand,
} from "../Command";
import {
  PresentationArgumentStream,
  StandardPresentationArgumentStream,
} from "../Command/PresentationStream";
import { CommandDispatcher, CommandDispatcherCallbacks } from "../Adaptor";
import { Err, Ok, Result, ResultError } from "@gnuxie/typescript-result";
import { readCommand } from "./TextCommandReader";
import { StringPresentationType } from "./TextPresentationTypes";

export class StandardCommandDispatcher<BasicInvocationInformation>
  implements CommandDispatcher<BasicInvocationInformation>
{
  private readonly callbacks: CommandDispatcherCallbacks<BasicInvocationInformation>;
  public constructor(
    private readonly commandTable: CommandTable,
    private readonly helpCommand: CommandDescription,
    callbacks?: CommandDispatcherCallbacks<BasicInvocationInformation>
  ) {
    this.callbacks = callbacks ?? {};
  }
  parsePartialCommandFromBody(
    commandInformation: BasicInvocationInformation,
    body: string
  ): Result<PartialCommand> {
    // The try is required because readCommand does not return `Result`s and throws errors.
    try {
      const readResult = readCommand(body);
      const firstItem = readResult.at(0);
      if (firstItem === undefined || typeof firstItem.object !== "string") {
        return ResultError.Result("No command found in the body.");
      }
      const prefix = this.callbacks.prefixExtractor?.(firstItem.object);
      if (prefix === undefined) {
        return ResultError.Result(
          "Could not extract a prefix from the body, the body does not contain a command."
        );
      }
      const normalisedCommand = [
        StringPresentationType.wrap(prefix),
        ...readResult.slice(1),
      ];
      return this.parsePartialCommandFromStream(
        commandInformation,
        new StandardPresentationArgumentStream(normalisedCommand)
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.callbacks.commandUncaughtErrorCB?.(
          commandInformation,
          body,
          error
        );
        if (this.callbacks.convertUncaughtErrorToResultError) {
          return Err(this.callbacks.convertUncaughtErrorToResultError(error));
        } else {
          throw new TypeError(
            `Caught an error when parsing a command, please use convertUncaughtErrorToResultError to handle this error and extract information from it.`
          );
        }
      } else {
        throw new TypeError(
          // I don't know what else we're going to do with it...
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `Something is throwing things that are not errors ${error})}`
        );
      }
    }
  }

  parsePartialCommandFromStream(
    commandInformation: BasicInvocationInformation,
    stream: PresentationArgumentStream
  ): Result<PartialCommand> {
    this.callbacks.logCurrentCommandCB?.(commandInformation, stream.source);
    const commandToUse =
      this.commandTable.findAMatchingCommand(stream) ?? this.helpCommand;
    const normalisedDesignator = stream.source
      .slice(0, stream.getPosition())
      .map((p) => p.object) as string[];
    const partialCommand = makePartialCommand(
      stream,
      commandToUse,
      normalisedDesignator
    );
    return Ok(partialCommand);
  }
}
