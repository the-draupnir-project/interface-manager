// SPDX-FileCopyrightText: 2025 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { Result } from "@gnuxie/typescript-result";
import { JSONErrorResponse } from "./JSONInterfaceAdaptor";

export type JSONRendererDescription<CommandResult = unknown> = {
  JSONRenderer?(
    commandResult: Result<CommandResult>
  ): Result<Record<string, unknown>, JSONErrorResponse>;
  confirmationJSONRenderer?(
    commandResult: Result<CommandResult>
  ): Result<Record<string, unknown>, JSONErrorResponse>;
};

export type DescribeJSONRenderer<CommandResult = unknown> =
  JSONRendererDescription<CommandResult>;
