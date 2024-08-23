// Copyright 2022, 2024 Gnuxie <Gnuxie@protonmail.com>
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

import { Ok, Result, isError } from "@gnuxie/typescript-result";
import { ParameterDescription, Prompt } from "./ParameterDescription";
import { Presentation, PresentationType } from "./Presentation";
import { KeywordParser } from "./KeywordParameterDescription";
import { ArgumentParseError, PromptRequiredError } from "./ParseErrors";
import { TextPresentationRenderer } from "../TextReader/TextPresentationRenderer";
import { PartialCommand } from "./Command";

/**
 * Describes a rest parameter for a command.
 * This consumes any arguments left over in the call to a command
 * into an array and ensures that each can be accepted by the `acceptor`.
 *
 * Any keywords in the rest of the command will be given to the `keywordParser`.
 */
export interface RestDescription<
  ExecutorContext = unknown,
  ObjectType = unknown,
> extends ParameterDescription<ExecutorContext> {
  readonly name: string;
  /** The presentation type of each item. */
  readonly acceptor: PresentationType;
  parseRest(
    partialCommand: PartialCommand,
    promptForRest: boolean,
    keywordParser: KeywordParser
  ): Result<Presentation[]>;
  readonly prompt?: Prompt<ExecutorContext, ObjectType> | undefined;
  readonly description?: string | undefined;
}

/**
 * Describes a rest parameter for a command.
 * This consumes any arguments left over in the call to a command
 * into an array and ensures that each can be accepted by the `acceptor`.
 *
 * Any keywords in the rest of the command will be given to the `keywordParser`.
 */
export class StandardRestDescription<
  ExecutorContext = unknown,
  ObjectType = unknown,
> implements ParameterDescription<ExecutorContext>
{
  constructor(
    public readonly name: string,
    /** The presentation type of each item. */
    public readonly acceptor: PresentationType,
    public readonly prompt?: Prompt<ExecutorContext, ObjectType>,
    public readonly description?: string
  ) {}

  /**
   * Parse the rest of a command.
   * @param stream An argument stream that starts at the rest of a command.
   * @param keywordParser Used to store any keywords found in the rest of the command.
   * @returns A ActionResult of ReadItems associated with the rest of the command.
   * If a ReadItem or Keyword is invalid for the command, then an error will be returned.
   */
  public parseRest(
    partialCommand: PartialCommand,
    promptForRest: boolean,
    keywordParser: KeywordParser
  ): Result<Presentation[]> {
    const stream = partialCommand.stream;
    const items: Presentation[] = [];
    if (
      this.prompt &&
      promptForRest &&
      stream.isPromptable() &&
      stream.peekItem(undefined) === undefined
    ) {
      return PromptRequiredError.Result(
        `A prompt is required for the missing argument for the ${this.name} parameter`,
        {
          promptParameter: this as ParameterDescription,
          partialCommand,
        }
      );
    }
    while (stream.peekItem(undefined) !== undefined) {
      const keywordResult = keywordParser.parseKeywords(partialCommand);
      if (isError(keywordResult)) {
        return keywordResult;
      }
      const nextItem = stream.peekItem(undefined);
      if (nextItem !== undefined) {
        const validationResult = this.acceptor.validator(nextItem);
        if (!validationResult) {
          return ArgumentParseError.Result(
            `Was expecting a match for the presentation type: ${this.acceptor.name} but got ${TextPresentationRenderer.render(nextItem)}.`,
            {
              parameter: this as ParameterDescription,
              partialCommand,
            }
          );
        }
        items.push(nextItem);
        stream.readItem(); // dispose of keyword's associated value from the stream.
      }
    }
    return Ok(items);
  }
}

export type DescribeRestParameters<
  ExecutorContext = unknown,
  ObjectType = unknown,
> = Omit<RestDescription<ExecutorContext, ObjectType>, "parseRest">;

export function describeRestParameters<ExecutorContext, ObjectType>(
  options: DescribeRestParameters<ExecutorContext, ObjectType>
): RestDescription<ExecutorContext, ObjectType> {
  return new StandardRestDescription<ExecutorContext, ObjectType>(
    options.name,
    options.acceptor,
    options.prompt,
    options.description
  );
}
