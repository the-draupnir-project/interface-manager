// Copyright 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { Presentation, PresentationType } from "./Presentation";

export enum PresentationSchemaType {
  Single = "Single",
  Union = "Union",
  Top = "Top",
}

type ObjectTypeForSingleSchema<T extends SinglePresentationSchema> =
  T["presentationType"] extends PresentationType<infer ObjectType>
    ? ObjectType
    : never;

type ObjectTypeForUnionSchema<T extends UnionPresentationSchema> =
  T["variants"] extends PresentationType<infer ObjectType>[]
    ? ObjectType
    : never;

type ObjectTypeForTopSchema = unknown;

/**
 * There is something wrong with the way argument parsing code is using validators
 * of presnetation types. When a parameter has declared that it expects arguments
 * to be of a presnetation type, all we should be doing is checking that the
 * presentationType of the argument is the specified presentation type.
 *
 * This works, except what happens when we want a command that accepts a union
 * of presentation types, or maybe the union of all known presentation types?
 *
 * Well that is probably an issue for the parameter description code right?
 * It has to specify a schema for the argument to get the presentation types it
 * expects, rather than just a presentation type.
 *
 * So is born the presentation schema.
 */
export type SinglePresentationSchema<ObjectType = unknown> = {
  readonly schemaType: PresentationSchemaType.Single;
  readonly presentationType: PresentationType<ObjectType>;
};

export type UnionPresentationSchema<ObjectType = unknown> = {
  readonly schemaType: PresentationSchemaType.Union;
  readonly variants: PresentationType<ObjectType>[];
};

export type TopPresentationSchema = {
  readonly schemaType: PresentationSchemaType.Top;
};

export const TopPresentationSchema: TopPresentationSchema = Object.freeze({
  schemaType: PresentationSchemaType.Top,
});

export type PresentationSchema<ObjectType = unknown> =
  | SinglePresentationSchema<ObjectType>
  | UnionPresentationSchema<ObjectType>
  | TopPresentationSchema;

export type ObjectTypeForPresentationSchema<T extends PresentationSchema> =
  T extends SinglePresentationSchema
    ? ObjectTypeForSingleSchema<T>
    : T extends UnionPresentationSchema
      ? ObjectTypeForUnionSchema<T>
      : T extends TopPresentationSchema
        ? ObjectTypeForTopSchema
        : never;

export function checkPresentationSchema<ObjectType>(
  schema: PresentationSchema,
  presentation: Presentation
): presentation is Presentation<ObjectType> {
  switch (schema.schemaType) {
    case PresentationSchemaType.Single:
      return presentation.presentationType === schema.presentationType;
    case PresentationSchemaType.Union:
      return Boolean(
        schema.variants.find(
          (presentationType) =>
            presentation.presentationType === presentationType
        )
      );
    case PresentationSchemaType.Top:
      return true;
  }
}

export function printPresentationSchema(schema: PresentationSchema): string {
  switch (schema.schemaType) {
    case PresentationSchemaType.Single:
      return schema.presentationType.name;
    case PresentationSchemaType.Union:
      return schema.variants.map((type) => type.name).join(" | ");
    case PresentationSchemaType.Top:
      return `TopPresentationSchema`;
  }
}
