// Copyright 2022 - 2024 Gnuxie <Gnuxie@protonmail.com>
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

/**
 * We might want to mix presentation methods into the presentation type
 * behind mirror chord in the future just for convienance.
 * I guess the inverse could also be done, that the presentation type
 * is mirror chord in the renderer to access the presentation method...
 * i like that. but then i can't remember if we can even use objects
 * as indexes in JS lol. but in that case we can just give presentation types
 * a mirror chord symbol each, and ditch the interning table, kinda like typebox.
 * ... we could just use the presentation type name for the mirror chord to
 * access the render method on the renderer....
 */

export interface PresentationType<ObjectType = unknown> {
  name: string;
  validator: (value: unknown) => value is ObjectType;
}

export interface Presentation<ObjectType = unknown> {
  object: ObjectType;
  presentationType: PresentationType;
}

const PRESENTATION_TYPES = new Map<
  /* the name of the presentation type. */ string,
  PresentationType
>();

export function findPresentationType(name: string): PresentationType {
  const entry = PRESENTATION_TYPES.get(name);
  if (entry) {
    return entry;
  } else {
    throw new TypeError(
      `presentation type with the name: ${name} was not registered`
    );
  }
}

export function registerPresentationType(
  name: string,
  presentationType: PresentationType
): PresentationType {
  if (PRESENTATION_TYPES.has(name)) {
    throw new TypeError(
      `presentation type with the name: ${name} has already been registered`
    );
  }
  PRESENTATION_TYPES.set(name, presentationType);
  return presentationType;
}

export function definePresentationType(
  description: PresentationType
): PresentationType {
  return registerPresentationType(description.name, Object.freeze(description));
}
