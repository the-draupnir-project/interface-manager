// Copyright 2022 Gnuxie <Gnuxie@protonmail.com>
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

import {
  CommandDescription,
  CommandExecutorFunction,
} from "./CommandDescription";
import {
  ArgumentsFromParametersTuple,
  DescribeCommandParametersOptions,
  DescribeParameter,
  describeCommandParameters,
} from "./ParameterParsing";

export type DescribeCommandOptions<
  Context,
  TInvocationInformation,
  CommandResult,
  Parameters extends
    DescribeParameter<Context>[] = DescribeParameter<Context>[],
> = {
  /** A short one line summary of what the command does to display alongside it's help */
  readonly summary: string;
  /** A longer description that goes into detail. */
  readonly description?: string;
  readonly executor: CommandExecutorFunction<
    Context,
    TInvocationInformation,
    CommandResult,
    ArgumentsFromParametersTuple<Parameters>
  >;
} & DescribeCommandParametersOptions<Context, Parameters>;

export function describeCommand<
  Context,
  TInvocationInformation = unknown,
  CommandResult = unknown,
  Parameters extends
    DescribeParameter<Context>[] = DescribeParameter<Context>[],
>(
  options: DescribeCommandOptions<
    Context,
    TInvocationInformation,
    CommandResult,
    Parameters
  >
): CommandDescription<
  Context,
  TInvocationInformation,
  CommandResult,
  Parameters
> {
  return {
    summary: options.summary,
    description: options.description,
    executor: options.executor,
    parametersDescription: describeCommandParameters<Context, Parameters>({
      parameters: options.parameters,
      rest: options.rest,
      keywords: options.keywords,
    }),
  };
}
