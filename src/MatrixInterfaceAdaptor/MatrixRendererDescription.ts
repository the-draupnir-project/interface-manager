// SPDX-FileCopyrightText: 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { Result } from "@gnuxie/typescript-result";
import { DocumentNode } from "../DeadDocument";

export interface MatrixRendererDescription<CommandResult = unknown> {
  /**
   * Render the result of a command invocation to DeadDocument.
   * The interface adaptor will then render this back to Matrix using an event.
   */
  JSXRenderer?(commandResult: Result<CommandResult>): Result<DocumentNode>;
  /**
   * Whether to always use the default renderer regardless of supporting renderers.
   * For example, Draupnir uses a renderer that adds tick and cross emoji to
   * commands depending on their result.
   */
  isAlwaysSupposedToUseDefaultRenderer: boolean;
  /**
   * If you need to do something completely arbritrary you can do so using this renderer.
   * The interface adaptor will give you everything that it has itself to render
   * `DeadDocument` back to Matrix.
   * @param context
   * @param commandResult
   * @param adaptorArguments
   */
  arbritraryRenderer?<
    AdaptorContext,
    MatrixEventContext,
    CommandResult,
    AdaptorArguments extends unknown[],
  >(
    context: AdaptorContext,
    eventContext: MatrixEventContext,
    commandResult: Result<CommandResult>,
    ...adaptorArguments: AdaptorArguments
  ): Promise<Result<void>>;
}
