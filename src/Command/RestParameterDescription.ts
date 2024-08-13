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

import { ParameterDescription, Prompt } from "./ParameterDescription";
import { PresentationType } from "./Presentation";

/**
 * Describes a rest parameter for a command.
 * This consumes any arguments left over in the call to a command
 * into an array and ensures that each can be accepted by the `acceptor`.
 *
 * Any keywords in the rest of the command will be given to the `keywordParser`.
 */
export interface RestDescription<ExecutorContext = unknown>
  extends ParameterDescription<ExecutorContext> {
  readonly name: string;
  /** The presentation type of each item. */
  readonly acceptor: PresentationType;
  readonly prompt?: Prompt<ExecutorContext>;
  readonly description?: string;
}
