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
import { ParameterDescription } from "./ParameterDescription";
import { ParameterMeta } from "./CommandMeta";
import {
  DescribeRestParameters,
  RestDescription,
  describeRestParameters,
} from "./RestParameterDescription";
import {
  DescribeKeywordParametersOptions,
  KeywordParametersDescription,
  describeKeywordParameters,
} from "./KeywordParameterDescription";
import { CompleteCommand, PartialCommand } from "./Command";
import { ArgumentParseError, PromptRequiredError } from "./ParseErrors";
import { TextPresentationRenderer } from "../TextReader/TextPresentationRenderer";
import { PresentationTypeWithoutWrap } from "./Presentation";
import {
  PresentationSchema,
  PresentationSchemaType,
  checkPresentationSchema,
  printPresentationSchema,
} from "./PresentationSchema";
import { ObjectTypeFromAcceptor } from "./PresentationSchema";
import { CommandMeta } from "./CommandMeta";

export type ParameterParseFunction<
  TCommandMeta extends CommandMeta = CommandMeta,
> = (partialCommand: PartialCommand) => Result<CompleteCommand<TCommandMeta>>;

export interface CommandParametersDescription<
  TCommandMeta extends CommandMeta,
> {
  readonly parse: ParameterParseFunction<TCommandMeta>;
  readonly descriptions: TCommandMeta["parameterDescriptions"];
  readonly rest?: RestDescription<TCommandMeta["restParameter"]> | undefined;
  readonly keywords: KeywordParametersDescription;
}

export class StandardCommandParametersDescription<
  TCommandMeta extends CommandMeta,
> implements CommandParametersDescription<TCommandMeta>
{
  constructor(
    public readonly descriptions: TCommandMeta["parameterDescriptions"],
    public readonly keywords: KeywordParametersDescription,
    public readonly rest?:
      | RestDescription<TCommandMeta["restParameter"]>
      | undefined
  ) {}

  public parse(
    partialCommand: PartialCommand<TCommandMeta>
  ): Result<CompleteCommand<TCommandMeta>> {
    const hasPrompted = false;
    const keywordsParser = this.keywords.getParser();
    const stream = partialCommand.stream;
    for (const parameter of this.descriptions) {
      // it eats any keywords at any point in the stream
      // as they can appear at any point technically.
      const keywordResult = keywordsParser.parseKeywords(partialCommand);
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
              partialCommand: partialCommand as PartialCommand,
            }
          );
        } else {
          return ArgumentParseError.Result(
            `An argument for the parameter ${parameter.name} was expected but was not provided.`,
            { parameter, partialCommand: partialCommand as PartialCommand }
          );
        }
      }
      if (!checkPresentationSchema(parameter.acceptor, nextItem)) {
        return ArgumentParseError.Result(
          `Was expecting a match for the presentation type: ${printPresentationSchema(parameter.acceptor)} but got ${TextPresentationRenderer.render(nextItem)}.`,
          {
            parameter: parameter,
            partialCommand: partialCommand as PartialCommand,
          }
        );
      }
      stream.readItem(); // disopose of argument.
    }
    const restResult = keywordsParser.parseRest(
      partialCommand as PartialCommand,
      hasPrompted,
      this.rest
    );
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
      description: partialCommand.description,
      immediateArguments: immediateArguments.map((p) => p.object),
      keywords: keywordsParser.getKeywords(),
      rest: restResult.ok?.map((p) => p.object) ?? [],
      designator: partialCommand.designator,
      isPartial: false,
    } as CompleteCommand<TCommandMeta>);
  }
}

export type DescribeCommandParametersOptions<TCommandMeta extends CommandMeta> =
  {
    readonly parameters: TCommandMeta["describeParameters"];
    readonly rest?: DescribeRestParameters | undefined;
    readonly keywords?: DescribeKeywordParametersOptions | undefined;
  };
export function describeCommandParameters<TCommandMeta extends CommandMeta>(
  options: DescribeCommandParametersOptions<TCommandMeta>
): CommandParametersDescription<TCommandMeta> {
  return new StandardCommandParametersDescription<TCommandMeta>(
    // i really don't care just fucking work.
    parameterDescriptionsFromParameterOptions(options.parameters),
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

export type DescribeParameter<TParameterMeta extends ParameterMeta> = Omit<
  ParameterDescription<TParameterMeta>,
  "acceptor"
> & {
  acceptor:
    | PresentationSchema<TParameterMeta["objectType"]>
    | PresentationTypeWithoutWrap<TParameterMeta["objectType"]>;
};

export type ExtractParameterObjectType<T extends DescribeParameter<never>> =
  ObjectTypeFromAcceptor<T["acceptor"]>;

function parameterDescriptionsFromParameterOptions<
  TCommandMeta extends CommandMeta,
>(
  descriptions: TCommandMeta["describeParameters"]
): TCommandMeta["parameterDescriptions"] {
  return descriptions.map(describeParameter);
}

function describeParameter<TParameterMeta extends ParameterMeta>(
  description: DescribeParameter<TParameterMeta>
): ParameterDescription<TParameterMeta> {
  if ("schemaType" in description.acceptor) {
    return description as ParameterDescription<TParameterMeta>;
  } else {
    return {
      ...description,
      acceptor: {
        schemaType: PresentationSchemaType.Single,
        presentationType: description.acceptor,
      },
    };
  }
}

/**
 * For some reason typescript really struggles to infer tuples.
 * So we have to use a function to guide the inference.
 * This is supposed to be used on parameter descriptions.
 */
export function tuple<T extends unknown[]>(...args: T): T {
  return args;
}
