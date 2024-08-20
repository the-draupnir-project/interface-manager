// Copyright 2023 - 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { Err, Result, ResultError } from "@gnuxie/typescript-result";
import { PresentationArgumentStream } from "./PresentationStream";
import { ParameterDescription } from "./ParameterDescription";
import { Presentation } from "./Presentation";

export class AbstractArgumentParseError extends ResultError {
  constructor(
    public readonly stream: PresentationArgumentStream,
    message: string
  ) {
    super(message);
  }

  public static Result(
    message: string,
    options: { stream: PresentationArgumentStream }
  ): Result<never, AbstractArgumentParseError> {
    return Err(new AbstractArgumentParseError(options.stream, message));
  }
}

export class ArgumentParseError extends AbstractArgumentParseError {
  constructor(
    public readonly parameter: ParameterDescription,
    stream: PresentationArgumentStream,
    message: string
  ) {
    super(stream, message);
  }

  public static Result<Ok>(
    message: string,
    options: {
      parameter: ParameterDescription;
      stream: PresentationArgumentStream;
    }
  ): Result<Ok, ArgumentParseError> {
    return Err(
      new ArgumentParseError(options.parameter, options.stream, message)
    );
  }
}

export class UnexpectedArgumentError extends AbstractArgumentParseError {
  public static Result<Ok>(
    message: string,
    options: { stream: PresentationArgumentStream }
  ): Result<Ok, UnexpectedArgumentError> {
    return Err(new UnexpectedArgumentError(options.stream, message));
  }
}

export interface PromptContext {
  items: string[];
  designator: string[];
}

export class PromptRequiredError extends ResultError {
  constructor(
    message: string,
    context: string[],
    public readonly parameterRequiringPrompt: ParameterDescription,
    public readonly priorItems: Presentation[]
  ) {
    super(message, context);
  }

  public static Result(
    message: string,
    {
      promptParameter,
      stream,
    }: {
      promptParameter: ParameterDescription;
      stream: PresentationArgumentStream;
    }
  ): Result<never, PromptRequiredError> {
    return Err(
      new PromptRequiredError(message, [], promptParameter, stream.priorItems())
    );
  }
}
