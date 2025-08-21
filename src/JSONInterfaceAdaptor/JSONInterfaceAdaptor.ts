// SPDX-FileCopyrightText: 2025 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { Result } from "@gnuxie/typescript-result";
import { CommandDescription, CommandMeta } from "../Command";
import { DescribeJSONRenderer } from "./JSONRendererDescription";

export type JSONErrorResponse<
  JSONBody extends Record<string, unknown> = Record<string, unknown>,
> = {
  readonly statusCode: number;
  readonly body: JSONBody;
};

export type AsyncCommandResultCB = (
  result: Result<Record<string, unknown>, JSONErrorResponse>
) => void;

export interface JSONInterfaceAdaptor<AdaptorContext, InvocationContext> {
  parseAndInvoke(
    jsonBody: Record<string, unknown>,
    context: AdaptorContext,
    invocationInfo: InvocationContext
  ): Promise<Result<Record<string, unknown>, JSONErrorResponse>>;
  asyncParseThenInvoke(
    jsonBody: Record<string, unknown>,
    context: AdaptorContext,
    invocationInfo: InvocationContext,
    cb: AsyncCommandResultCB
  ): Promise<Result<void, JSONErrorResponse>>;
  describeRenderer<TCommandMeta extends CommandMeta>(
    commandDescription: CommandDescription<TCommandMeta>,
    rendererDescription: DescribeJSONRenderer<TCommandMeta["CommandResult"]>
  ): JSONInterfaceAdaptor<AdaptorContext, InvocationContext>;
  isDescribingRendererForCommand<
    TCommandDescription extends CommandDescription,
  >(
    commandDescription: TCommandDescription
  ): boolean;
  renderedCommands(): CommandDescription[];
}
