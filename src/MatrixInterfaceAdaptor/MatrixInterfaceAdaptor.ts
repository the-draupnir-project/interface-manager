// SPDX-FileCopyrightText: 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { Ok, Result, isError } from "@gnuxie/typescript-result";
import { Command, CommandDescription } from "../Command";
import { MatrixRendererDescription } from "./MatrixRendererDescription";
import { DocumentNode } from "../DeadDocument";

export interface MatrixInterfaceAdaptor<MatrixEventContext> {
  invoke<CommandResult>(
    command: Command,
    eventContext: MatrixEventContext
  ): Promise<Result<CommandResult>>;
  registerRendererDescription(
    commandDescription: CommandDescription,
    rendererDescription: MatrixRendererDescription
  ): MatrixInterfaceAdaptor<MatrixEventContext>;
}

export type MatrixInterfaceDefaultRenderer<
  AdaptorContext,
  MatrixEventContext,
  CommandResult = unknown,
> = (
  adaptorCotnext: AdaptorContext,
  matrixEventContext: MatrixEventContext,
  commandResult: CommandResult
) => Promise<Result<void>>;

export type MatrixInterfaceEventsFromDeadDocument<
  AdaptorContext,
  MatrixEventContext,
> = (
  adaptorContext: AdaptorContext,
  eventContext: MatrixEventContext,
  document: DocumentNode
) => Promise<Result<void>>;

export class StandardMatrixInterfaceAdaptor<AdaptorContext, MatrixEventContext>
  implements MatrixInterfaceAdaptor<MatrixEventContext>
{
  private readonly renderers = new Map<
    CommandDescription,
    MatrixRendererDescription
  >();
  public constructor(
    private readonly adaptorContext: AdaptorContext,
    private readonly defaultRenderer: MatrixInterfaceDefaultRenderer<
      AdaptorContext,
      MatrixEventContext
    >,
    private readonly matrixEventsFromDeadDocument: MatrixInterfaceEventsFromDeadDocument<
      AdaptorContext,
      MatrixEventContext
    >
  ) {
    // nothing to do.
  }
  public async invoke<CommandResult>(
    command: Command,
    matrixEventContext: MatrixEventContext
  ): Promise<Result<CommandResult>> {
    const renderer = this.renderers.get(command.description);
    if (renderer === undefined) {
      throw new TypeError(
        `There is no renderer defined for the command ${command.description.summary}`
      );
    }
    const commandResult = await command.description.executor(
      this.adaptorContext,
      command.keywords,
      ...command.immediateArguments,
      ...(command.rest ?? [])
    );
    const renderResults = await Promise.all([
      this.maybeRunDefaultRenderer(renderer, matrixEventContext, commandResult),
      this.maybeRunJSXRenderer(renderer, matrixEventContext, commandResult),
      this.maybeRunArbritraryRenderer(
        renderer,
        matrixEventContext,
        commandResult
      ),
    ]);
    for (const result of renderResults) {
      if (isError(result)) {
        return result;
      }
    }
    return commandResult as Result<CommandResult>;
  }

  private async maybeRunDefaultRenderer(
    renderer: MatrixRendererDescription,
    eventContext: MatrixEventContext,
    commandResult: Result<unknown>
  ): Promise<Result<void>> {
    if (renderer.isAlwaysSupposedToUseDefaultRenderer) {
      return await this.defaultRenderer(
        this.adaptorContext,
        eventContext,
        commandResult
      );
    } else {
      return Ok(undefined);
    }
  }

  private async maybeRunJSXRenderer(
    renderer: MatrixRendererDescription,
    eventContext: MatrixEventContext,
    commandResult: Result<unknown>
  ): Promise<Result<void>> {
    if (renderer.JSXRenderer) {
      const document = renderer.JSXRenderer(commandResult);
      if (isError(document)) {
        return document;
      }
      return await this.matrixEventsFromDeadDocument(
        this.adaptorContext,
        eventContext,
        document.ok
      );
    } else {
      return Ok(undefined);
    }
  }

  private async maybeRunArbritraryRenderer(
    renderer: MatrixRendererDescription,
    eventContext: MatrixEventContext,
    commandResult: Result<unknown>
  ): Promise<Result<void>> {
    if (renderer.arbritraryRenderer) {
      return await renderer.arbritraryRenderer(
        this.adaptorContext,
        eventContext,
        commandResult
      );
    } else {
      return Ok(undefined);
    }
  }
  registerRendererDescription(
    commandDescription: CommandDescription,
    rendererDescription: MatrixRendererDescription
  ): this {
    this.renderers.set(commandDescription, rendererDescription);
    return this;
  }
}
