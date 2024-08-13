// Copyright 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { CommandDescription } from "./CommandDescription";
import { ParsedKeywords } from "./ParsedKeywords";

export interface Command<
  Arguments extends unknown[] = unknown[],
  RestArguments extends unknown[] = unknown[],
> {
  readonly description: CommandDescription;
  readonly immediateArguments: Arguments;
  readonly rest?: RestArguments[];
  readonly keywords: ParsedKeywords;
}
