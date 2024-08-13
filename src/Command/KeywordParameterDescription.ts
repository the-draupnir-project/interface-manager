// Copyright 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { ParameterDescription } from "./ParameterDescription";

/**
 * An extension of ParameterDescription, some keyword arguments
 * may just be flags that have no associated property in syntax,
 * and their presence is to associate the value `true`.
 */
export interface KeywordPropertyDescription extends ParameterDescription {
  readonly isFlag: boolean;
}

/**
 * Describes which keyword arguments can be accepted by a command.
 */
export interface KeywordParameterDescription {
  readonly keywordDescriptions: {
    [prop: string]: KeywordPropertyDescription | undefined;
  };
  readonly allowOtherKeys?: boolean;
}
