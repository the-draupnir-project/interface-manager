// Copyright 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { KeywordParameterDescription } from "./KeywordParameterDescription";
import { Presentation } from "./Presentation";

export interface ParsedKeywords {
  getKeywordValue<ObjectType = unknown>(
    keyword: string,
    defaultValue?: ObjectType | undefined
  ): ObjectType | undefined;
}

/**
 * A read only map of keywords to their associated properties.
 */
export class StandardParsedKeywords implements ParsedKeywords {
  constructor(
    private readonly description: KeywordParameterDescription,
    private readonly keywords: ReadonlyMap<string, Presentation | true>
  ) {}

  public getKeywordValue<ObjectType = unknown>(
    keyword: string,
    defaultValue: ObjectType | undefined = undefined
  ): ObjectType | undefined {
    const keywordDescription = this.description.keywordDescriptions[keyword];
    if (keywordDescription === undefined) {
      throw new TypeError(
        `${keyword} is not a keyword that has been described for this command.`
      );
    }
    const value = this.keywords.get(keyword);
    if (value !== undefined) {
      return value as ObjectType;
    } else {
      return defaultValue;
    }
  }
}
