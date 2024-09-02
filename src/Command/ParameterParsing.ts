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

export type ParameterParseFunction<
  Arguments extends unknown[] = unknown[],
  RestArguments extends unknown[] = unknown[],
> = (
  partialCommand: PartialCommand
) => Result<CompleteCommand<Arguments, RestArguments>>;

export interface CommandParametersDescription<
  Context,
  TParameters extends ParameterDescription<Context>[],
> {
  readonly parse: ParameterParseFunction;
  readonly descriptions: TParameters;
  readonly rest?: RestDescription | undefined;
  readonly keywords: KeywordParameterDescription;
}

export class StandardCommandParametersDescription<
  Context,
  TParameters extends ParameterDescription<Context>[],
> implements CommandParametersDescription<Context, TParameters>
{
  constructor(
    public readonly descriptions: TParameters,
    public readonly keywords: KeywordParameterDescription,
    public readonly rest?: RestDescription | undefined
  ) {}

  public parse<
    Arguments extends unknown[] = unknown[],
    RestArguments extends unknown[] = unknown[],
  >(
    partialCommand: PartialCommand
  ): Result<CompleteCommand<Arguments, RestArguments>> {
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
              promptParameter: parameter as ParameterDescription,
              partialCommand,
            }
          );
        } else {
          return ArgumentParseError.Result(
            `An argument for the parameter ${parameter.name} was expected but was not provided.`,
            { parameter: parameter as ParameterDescription, partialCommand }
          );
        }
      }
      if (!checkPresentationSchema(parameter.acceptor, nextItem)) {
        return ArgumentParseError.Result(
          `Was expecting a match for the presentation type: ${printPresentationSchema(parameter.acceptor)} but got ${TextPresentationRenderer.render(nextItem)}.`,
          {
            parameter: parameter as ParameterDescription,
            partialCommand,
          }
        );
      }
      stream.readItem(); // disopose of argument.
    }
    const restResult = keywordsParser.parseRest(
      partialCommand,
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
    } as CompleteCommand<Arguments, RestArguments>);
  }
}

export type ParameterDescriptionsFromArguments<Arguments extends unknown[]> = {
  [I in keyof Arguments]: ParameterDescription<Arguments[I]>;
};

export type ArgumentsFromParametersTuple<
  TParameters extends DescribeParameter<never>[],
> = {
  [I in keyof TParameters]: ExtractParameterObjectType<TParameters[I]>;
};

export type ParameterDescriptionFromParamaters<
  Context,
  TParameters extends DescribeParameter<Context>[],
> = {
  [I in keyof TParameters]: ParameterDescription<
    Context,
    ExtractParameterObjectType<TParameters[I]>
  >;
};

export type DescribeCommandParametersOptions<
  Context = unknown,
  TParameters extends
    DescribeParameter<Context>[] = DescribeParameter<Context>[],
> = {
  readonly parameters: TParameters;
  readonly rest?: DescribeRestParameters | undefined;
  readonly keywords?: DescribeKeywordParametersOptions | undefined;
};
export function describeCommandParameters<
  Context = unknown,
  TParameters extends
    DescribeParameter<Context>[] = DescribeParameter<Context>[],
>(
  options: DescribeCommandParametersOptions<Context, TParameters>
): CommandParametersDescription<
  Context,
  ParameterDescriptionFromParamaters<Context, TParameters>
> {
  return new StandardCommandParametersDescription(
    // i really don't care just fucking work.
    parameterDescriptionsFromParameterOptions(
      options.parameters as DescribeParameter<unknown>[]
    ) as unknown as ParameterDescription<unknown, TParameters>[],
    options.keywords === undefined
      ? describeKeywordParameters({
          keywordDescriptions: {},
          allowOtherKeys: false,
        })
      : describeKeywordParameters(options.keywords),
    options.rest === undefined
      ? undefined
      : describeRestParameters(options.rest)
  ) as CommandParametersDescription<
    Context,
    ParameterDescriptionFromParamaters<Context, TParameters>
  >;
}

export type DescribeParameter<ExecutorContext, ObjectType = unknown> = Omit<
  ParameterDescription<ExecutorContext, ObjectType>,
  "acceptor"
> & {
  acceptor:
    | PresentationSchema<ObjectType>
    | PresentationTypeWithoutWrap<ObjectType>;
};

export type ExtractParameterObjectType<T extends DescribeParameter<never>> =
  ObjectTypeFromAcceptor<T["acceptor"]>;

function parameterDescriptionsFromParameterOptions<
  Context,
  TParameters extends DescribeParameter<Context>[],
>(
  descriptions: TParameters
): ParameterDescriptionFromParamaters<Context, TParameters> {
  return descriptions.map(
    describeParameter
  ) as ParameterDescriptionFromParamaters<Context, TParameters>;
}

function describeParameter<ExecutorContext, ObjectType>(
  description: DescribeParameter<ExecutorContext, ObjectType>
): ParameterDescription<ExecutorContext, ObjectType> {
  if ("schemaType" in description.acceptor) {
    return description as ParameterDescription<ExecutorContext, ObjectType>;
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
