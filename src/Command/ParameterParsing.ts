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
import { PresentationArgumentStream } from "./PresentationStream";
import { ParameterDescription } from "./ParameterDescription";
import {
  DescribeRestParameters,
  RestDescription,
  describeRestParameters,
} from "./RestParameterDescription";
import {
  DescribeKeywordParametersOptions,
  KeywordParameterDescription,
  describeKeywordParameters,
} from "./KeywordParameterDescription";
import { CommandDescription } from "./CommandDescription";
import { Command } from "./Command";
import { ArgumentParseError, PromptRequiredError } from "./ParseErrors";
import { TextPresentationRenderer } from "../TextReader/TextPresentationRenderer";
import { PresentationType } from "./Presentation";

export type ParameterParseFunction<
  Arguments extends unknown[] = unknown[],
  RestArguments extends unknown[] = unknown[],
> = (
  command: CommandDescription,
  designator: string[],
  stream: PresentationArgumentStream
) => Result<Command<Arguments, RestArguments>>;

export interface CommandParametersDescription {
  readonly parse: ParameterParseFunction;
  readonly descriptions: ParameterDescription[];
  readonly rest?: RestDescription | undefined;
  readonly keywords: KeywordParameterDescription;
}

export class StandardCommandParametersDescription
  implements CommandParametersDescription
{
  constructor(
    public readonly descriptions: ParameterDescription[],
    public readonly keywords: KeywordParameterDescription,
    public readonly rest?: RestDescription | undefined
  ) {}

  public parse<
    Arguments extends unknown[] = unknown[],
    RestArguments extends unknown[] = unknown[],
  >(
    command: CommandDescription<unknown, unknown, Arguments>,
    designator: string[],
    stream: PresentationArgumentStream
  ): Result<Command<Arguments, RestArguments>> {
    const hasPrompted = false;
    const keywordsParser = this.keywords.getParser();
    for (const parameter of this.descriptions) {
      // it eats any keywords at any point in the stream
      // as they can appear at any point technically.
      const keywordResult = keywordsParser.parseKeywords(stream);
      if (isError(keywordResult)) {
        return keywordResult;
      }
      const nextItem = stream.peekItem();
      if (nextItem === undefined) {
        if (parameter.prompt && stream.isPromptable()) {
          return PromptRequiredError.Result(
            `A prompt is required for the parameter ${parameter.name}`,
            {
              promptParameter: parameter,
              stream,
            }
          );
        } else {
          return ArgumentParseError.Result(
            `An argument for the parameter ${parameter.name} was expected but was not provided.`,
            { parameter, stream }
          );
        }
      }
      if (!parameter.acceptor.validator(nextItem)) {
        return ArgumentParseError.Result(
          `Was expecting a match for the presentation type: ${parameter.acceptor.name} but got ${TextPresentationRenderer.render(nextItem)}.`,
          {
            parameter,
            stream,
          }
        );
      }
      stream.readItem(); // disopose of argument.
    }
    const restResult = keywordsParser.parseRest(stream, hasPrompted, this.rest);
    if (isError(restResult)) {
      return restResult;
    }
    const immediateArguments =
      restResult.ok === undefined ||
      restResult.ok.length === 0 ||
      restResult.ok[0] === undefined
        ? stream.source
        : stream.source.slice(0, stream.source.indexOf(restResult.ok[0]));
    return Ok({
      description: command,
      immediateArguments: immediateArguments.map((p) => p.object),
      keywords: keywordsParser.getKeywords(),
      rest: restResult.ok?.map((p) => p.object) ?? [],
      designator,
    } as Command<Arguments, RestArguments>);
  }
}

export type DescribeCommandParametersOptions = {
  readonly parameters: ParameterDescription[];
  readonly rest?: DescribeRestParameters | undefined;
  readonly keywords?: DescribeKeywordParametersOptions | undefined;
};
export function describeCommandParameters(
  options: DescribeCommandParametersOptions
): CommandParametersDescription {
  return new StandardCommandParametersDescription(
    options.parameters,
    options.keywords === undefined
      ? describeKeywordParameters({
          keywordDescriptions: {},
          allowOtherKeys: false,
        })
      : describeKeywordParameters(options.keywords),
    options.rest === undefined
      ? undefined
      : describeRestParameters(options.rest)
  );
}

export function union<ObjectType = unknown>(
  ...presentationTypes: PresentationType[]
): PresentationType {
  const name = presentationTypes.map((type) => type.name).join(" | ");
  return {
    name,
    validator: (value: unknown): value is ObjectType => {
      return presentationTypes.some((p) => p.validator(value));
    },
  };
}
