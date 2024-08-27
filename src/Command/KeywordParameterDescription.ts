// Copyright 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { Result, Ok, isError, ResultError } from "@gnuxie/typescript-result";
import { TextPresentationRenderer } from "../TextReader/TextPresentationRenderer";
import { Keyword } from "./Keyword";
import { ParameterDescription } from "./ParameterDescription";
import { ArgumentParseError, UnexpectedArgumentError } from "./ParseErrors";
import { ParsedKeywords, StandardParsedKeywords } from "./ParsedKeywords";
import { Presentation } from "./Presentation";
import { RestDescription } from "./RestParameterDescription";
import { PartialCommand } from "./Command";
import {
  checkPresentationSchema,
  printPresentationSchema,
} from "./PresentationSchema";

/**
 * An extension of ParameterDescription, some keyword arguments
 * may just be flags that have no associated property in syntax,
 * and their presence is to associate the value `true`.
 */
export interface KeywordPropertyDescription extends ParameterDescription {
  readonly isFlag: boolean;
}

/**
 * Describes which keyword arguments can be accepted by a command.
 */
export interface KeywordParameterDescription {
  readonly keywordDescriptions: {
    [prop: string]: KeywordPropertyDescription | undefined;
  };
  readonly allowOtherKeys?: boolean;
  getParser(): KeywordParser;
}

/**
 * A helper that gets instantiated for each command invoccation to parse and build
 * the map representing the association between keywords and their properties.
 */
export class KeywordParser {
  private readonly arguments = new Map<string, Presentation | true>();

  constructor(public readonly description: KeywordParameterDescription) {}

  public getKeywords(): ParsedKeywords {
    return new StandardParsedKeywords(this.description, this.arguments);
  }

  private readKeywordAssociatedProperty(
    keyword: KeywordPropertyDescription,
    partialCommand: PartialCommand
  ): Result<Presentation | true, ArgumentParseError> {
    const stream = partialCommand.stream;
    const nextItem = stream.peekItem();
    if (nextItem !== undefined && !(nextItem.object instanceof Keyword)) {
      if (checkPresentationSchema(keyword.acceptor, nextItem)) {
        return Ok(stream.readItem());
      } else {
        return ArgumentParseError.Result(
          `Was expecting a match for the presentation type: ${printPresentationSchema(keyword.acceptor)} but got ${TextPresentationRenderer.render(nextItem)}.`,
          {
            parameter: keyword,
            partialCommand,
          }
        );
      }
    } else {
      if (!keyword.isFlag) {
        return ArgumentParseError.Result(
          `An associated argument was not provided for the keyword ${keyword.name}.`,
          { parameter: keyword, partialCommand }
        );
      } else {
        return Ok(true);
      }
    }
  }

  public parseKeywords(partialCommand: PartialCommand): Result<this> {
    const stream = partialCommand.stream;
    while (stream.peekItem()?.object instanceof Keyword) {
      const item = stream.readItem() as Presentation<Keyword>;
      const description =
        this.description.keywordDescriptions[item.object.designator];
      if (description === undefined) {
        if (this.description.allowOtherKeys) {
          throw new TypeError("Allow other keys is umimplemented");
          // i don't think this can be implemented,
          // how do you tell an extra key is a flag or has an associated
          // property?
        } else {
          return UnexpectedArgumentError.Result(
            `Encountered unexpected keyword argument: ${item.object.designator}`,
            { partialCommand }
          );
        }
      } else {
        const associatedPropertyResult = this.readKeywordAssociatedProperty(
          description,
          partialCommand
        );
        if (isError(associatedPropertyResult)) {
          return associatedPropertyResult;
        } else {
          this.arguments.set(description.name, associatedPropertyResult.ok);
        }
      }
    }
    return Ok(this);
  }

  public parseRest(
    partialCommand: PartialCommand,
    shouldPromptForRest = false,
    restDescription?: RestDescription
  ): Result<Presentation[] | undefined> {
    const stream = partialCommand.stream;
    if (restDescription !== undefined) {
      return restDescription.parseRest(
        partialCommand,
        shouldPromptForRest,
        this
      );
    } else {
      const result = this.parseKeywords(partialCommand);
      if (isError(result)) {
        return result;
      }
      if (stream.peekItem() !== undefined) {
        return ResultError.Result(
          `There is an unexpected non-keyword argument ${JSON.stringify(stream.peekItem())}`
        );
      } else {
        return Ok(undefined);
      }
    }
  }
}

export type DescribeKeywordParametersOptions = Omit<
  KeywordParameterDescription,
  "getParser"
>;

export function describeKeywordParameters(
  options: DescribeKeywordParametersOptions
): KeywordParameterDescription {
  return {
    ...options,
    getParser() {
      return new KeywordParser(this);
    },
  };
}
