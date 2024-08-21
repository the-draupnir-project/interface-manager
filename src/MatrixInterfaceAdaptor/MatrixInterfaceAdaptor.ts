// SPDX-FileCopyrightText: 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { Ok, Result, ResultError, isError } from "@gnuxie/typescript-result";
import {
  Command,
  CommandDescription,
  PresentationArgumentStream,
} from "../Command";
import { MatrixRendererDescription } from "./MatrixRendererDescription";
import { DocumentNode } from "../DeadDocument";

export interface MatrixInterfaceAdaptor<MatrixEventContext> {
  invoke<CommandResult>(
    command: Command,
    eventContext: MatrixEventContext
  ): Promise<Result<CommandResult>>;
  parseAndInvoke<CommandResult>(
    commandDescription: CommandDescription,
    eventContext: MatrixEventContext,
    stream: PresentationArgumentStream
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

export type MatrixInterfaceRendererFailedCB<
  AdaptorContext,
  MatrixEventContext,
> = (
  adaptorContext: AdaptorContext,
  matrixEventContext: MatrixEventContext,
  error: ResultError
) => void;

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
    >,
    private readonly rendererFailedCB: MatrixInterfaceRendererFailedCB<
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
    const renderer = this.findRendererForCommandDescription(
      command.description
    );
    const commandResult = await command.description.executor(
      this.adaptorContext,
      command.keywords,
      ...command.immediateArguments,
      ...(command.rest ?? [])
    );
    return (await this.runRenderersOnCommandResult(
      commandResult,
      renderer,
      matrixEventContext
    )) as Result<CommandResult>;
  }

  private findRendererForCommandDescription(
    commandDescription: CommandDescription
  ): MatrixRendererDescription {
    const renderer = this.renderers.get(commandDescription);
    if (renderer === undefined) {
      throw new TypeError(
        `There is no renderer defined for the command ${commandDescription.summary}`
      );
    }
    return renderer;
  }

  private async runRenderersOnCommandResult(
    commandResult: Result<unknown>,
    renderer: MatrixRendererDescription,
    matrixEventContext: MatrixEventContext
  ): Promise<Result<unknown>> {
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
        this.rendererFailedCB(
          this.adaptorContext,
          matrixEventContext,
          result.error
        );
      }
    }
    return commandResult;
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
  public registerRendererDescription(
    commandDescription: CommandDescription,
    rendererDescription: MatrixRendererDescription
  ): this {
    this.renderers.set(commandDescription, rendererDescription);
    return this;
  }

  public async parseAndInvoke<CommandResult>(
    commandDescription: CommandDescription,
    eventContext: MatrixEventContext,
    stream: PresentationArgumentStream
  ): Promise<Result<CommandResult>> {
    const renderer = this.findRendererForCommandDescription(commandDescription);
    const parseResult = commandDescription.parametersDescription.parse(
      commandDescription,
      stream
    );
    if (isError(parseResult)) {
      return (await this.runRenderersOnCommandResult(
        parseResult,
        renderer,
        eventContext
      )) as Result<CommandResult>;
    }
    return await this.invoke(parseResult.ok, eventContext);
  }
}
