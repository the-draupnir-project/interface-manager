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
  CompleteCommand,
  PartialCommand,
} from "../Command";
import { MatrixRendererDescription } from "./MatrixRendererDescription";
import { DocumentNode } from "../DeadDocument";
import { AdaptorToCommandContextTranslator } from "./AdaptorToCommandContextTranslator";

export interface MatrixInterfaceAdaptor<AdaptorContext, MatrixEventContext> {
  /**
   * Invoke the command object, running the command executor and then calling
   * each of the configured renderers for the interface adaptor.
   */
  invoke<CommandResult>(
    command: CompleteCommand,
    adaptorContext: AdaptorContext,
    eventContext: MatrixEventContext
  ): Promise<Result<CommandResult>>;
  /**
   * Parse the arguments to the command description and then call `invoke`.
   * The commandDesignator is required so that we can produce a `Command` object.
   */
  parseAndInvoke<CommandResult>(
    partialCommand: PartialCommand,
    adaptorContext: AdaptorContext,
    eventContext: MatrixEventContext
  ): Promise<Result<CommandResult>>;
  registerRendererDescription(
    commandDescription: CommandDescription,
    rendererDescription: MatrixRendererDescription
  ): MatrixInterfaceAdaptor<AdaptorContext, MatrixEventContext>;
}

export type MatrixInterfaceDefaultRenderer<
  AdaptorContext,
  MatrixEventContext,
  CommandResult = unknown,
> = (
  adaptorCotnext: AdaptorContext,
  matrixEventContext: MatrixEventContext,
  command: Command,
  commandResult: Result<CommandResult>
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
  command: Command,
  error: ResultError
) => void;

export class StandardMatrixInterfaceAdaptor<AdaptorContext, MatrixEventContext>
  implements MatrixInterfaceAdaptor<AdaptorContext, MatrixEventContext>
{
  private readonly renderers = new Map<
    CommandDescription,
    MatrixRendererDescription
  >();
  public constructor(
    private readonly adaptorToCommandContextTranslator: AdaptorToCommandContextTranslator<AdaptorContext>,
    /** Render the result and return an error if there was a problem while rendering. */
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
    command: CompleteCommand,
    adaptorContext: AdaptorContext,
    matrixEventContext: MatrixEventContext
  ): Promise<Result<CommandResult>> {
    const renderer = this.findRendererForCommandDescription(
      command.description
    );
    const commandContext =
      this.adaptorToCommandContextTranslator.translateContext(
        command.description,
        adaptorContext
      );
    const commandResult = await command.description.executor(
      commandContext,
      command.keywords,
      ...command.immediateArguments,
      ...(command.rest ?? [])
    );
    return (await this.runRenderersOnCommandResult(
      command.toPartialCommand(),
      commandResult,
      renderer,
      adaptorContext,
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
    partialCommand: PartialCommand,
    commandResult: Result<unknown>,
    renderer: MatrixRendererDescription,
    adaptorContext: AdaptorContext,
    matrixEventContext: MatrixEventContext
  ): Promise<Result<unknown>> {
    const renderResults = await Promise.all([
      this.maybeRunDefaultRenderer(
        renderer,
        adaptorContext,
        matrixEventContext,
        partialCommand,
        commandResult
      ),
      this.maybeRunJSXRenderer(
        renderer,
        adaptorContext,
        matrixEventContext,
        commandResult
      ),
      this.maybeRunArbritraryRenderer(
        renderer,
        adaptorContext,
        matrixEventContext,
        commandResult
      ),
    ]);
    for (const result of renderResults) {
      if (isError(result)) {
        this.rendererFailedCB(
          adaptorContext,
          matrixEventContext,
          partialCommand,
          result.error
        );
      }
    }
    return commandResult;
  }

  private async maybeRunDefaultRenderer(
    renderer: MatrixRendererDescription,
    adaptorContext: AdaptorContext,
    eventContext: MatrixEventContext,
    command: Command,
    commandResult: Result<unknown>
  ): Promise<Result<void>> {
    if (renderer.isAlwaysSupposedToUseDefaultRenderer) {
      return await this.defaultRenderer(
        adaptorContext,
        eventContext,
        command,
        commandResult
      );
    } else {
      return Ok(undefined);
    }
  }

  private async maybeRunJSXRenderer(
    renderer: MatrixRendererDescription,
    adaptorContext: AdaptorContext,
    eventContext: MatrixEventContext,
    commandResult: Result<unknown>
  ): Promise<Result<void>> {
    if (renderer.JSXRenderer) {
      const document = renderer.JSXRenderer(commandResult);
      if (isError(document)) {
        return document;
      }
      return await this.matrixEventsFromDeadDocument(
        adaptorContext,
        eventContext,
        document.ok
      );
    } else {
      return Ok(undefined);
    }
  }

  private async maybeRunArbritraryRenderer(
    renderer: MatrixRendererDescription,
    adaptorContext: AdaptorContext,
    eventContext: MatrixEventContext,
    commandResult: Result<unknown>
  ): Promise<Result<void>> {
    if (renderer.arbritraryRenderer) {
      return await renderer.arbritraryRenderer(
        adaptorContext,
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
    partialCommand: PartialCommand,
    adaptorContext: AdaptorContext,
    eventContext: MatrixEventContext
  ): Promise<Result<CommandResult>> {
    const renderer = this.findRendererForCommandDescription(
      partialCommand.description
    );
    const parseResult =
      partialCommand.description.parametersDescription.parse(partialCommand);
    if (isError(parseResult)) {
      return (await this.runRenderersOnCommandResult(
        partialCommand,
        parseResult,
        renderer,
        adaptorContext,
        eventContext
      )) as Result<CommandResult>;
    }
    return await this.invoke(parseResult.ok, adaptorContext, eventContext);
  }
}
