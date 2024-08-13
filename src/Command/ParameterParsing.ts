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

import { Result } from "@gnuxie/typescript-result";
import { PresentationArgumentStream } from "./PresentationStream";
import { ParameterDescription } from "./ParameterDescription";
import { RestDescription } from "./RestParameterDescription";
import { KeywordParameterDescription } from "./KeywordParameterDescription";
import { CommandDescription } from "./CommandDescription";
import { Command } from "./Command";

export type ParameterParseFunction<
  Arguments extends unknown[] = unknown[],
  RestArguments extends unknown[] = unknown[],
> = (
  command: CommandDescription,
  stream: PresentationArgumentStream
) => Result<Command<Arguments, RestArguments>>;

export interface CommandParametersDescription {
  readonly parse: ParameterParseFunction;
  readonly descriptions: ParameterDescription[];
  readonly rest?: RestDescription | undefined;
  readonly keywords: KeywordParameterDescription;
}
