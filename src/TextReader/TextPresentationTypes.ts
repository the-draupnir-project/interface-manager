// Copyright 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import {
  MatrixEventReference,
  MatrixEventViaAlias,
  MatrixEventViaRoomID,
  MatrixRoomAlias,
  MatrixRoomID,
  MatrixRoomReference,
  MatrixUserID,
} from "@the-draupnir-project/matrix-basic-types";
import { Presentation, definePresentationType } from "../Command/Presentation";
import { Keyword } from "../Command/Keyword";
import { TextPresentationRenderer } from "./TextPresentationRenderer";

/**
 * If you are wondering why commands specify on presentation type and not
 * their actual type, then imagine that you have a a presentation type
 * for a person's name, and you render that in handwriting.
 * The person's name is really just a string, and it'd be wrong to be able to
 * get any string with that command as a name. OTOH, I don't really see the
 * point in that? WHy not just make a real type for a person's name?
 */

// is there any reason to include a table? when we could just use this?
export const StringPresentationType = definePresentationType({
  name: "string",
  validator: function (value): value is string {
    return typeof value === "string";
  },
});

export function makeStringPresentation(string: string): Presentation<string> {
  return Object.freeze({
    object: string,
    presentationType: StringPresentationType,
  });
}

TextPresentationRenderer.registerPresentationRenderer<string>(
  StringPresentationType,
  function (presentation) {
    return presentation.object;
  }
);

export const KeywordPresentationType = definePresentationType({
  name: "Keyword",
  validator: function (value): value is Keyword {
    return value instanceof Keyword;
  },
});

export function makeKeywordPresentation(
  keyword: Keyword
): Presentation<Keyword> {
  return Object.freeze({
    object: keyword,
    presentationType: KeywordPresentationType,
  });
}

TextPresentationRenderer.registerPresentationRenderer<Keyword>(
  KeywordPresentationType,
  function (presetnation) {
    return `--${presetnation.object.designator}`;
  }
);

export const MatrixRoomReferencePresentationType = definePresentationType({
  name: "MatrixRoomReference",
  validator: function (value): value is MatrixRoomReference {
    return value instanceof MatrixRoomID || value instanceof MatrixRoomAlias;
  },
});

export function makeMatrixRoomReferencePresentation(
  room: MatrixRoomReference
): Presentation<MatrixRoomReference> {
  return Object.freeze({
    object: room,
    presentationType: MatrixRoomReferencePresentationType,
  });
}

TextPresentationRenderer.registerPresentationRenderer<MatrixRoomReference>(
  MatrixRoomReferencePresentationType,
  function (presentation) {
    return presentation.object.toPermalink();
  }
);

export const MatrixUserIDPresentationType = definePresentationType({
  name: "MatrixUserID",
  validator: function (value): value is MatrixUserID {
    return value instanceof MatrixUserID;
  },
});

export function makeMatrixUserIDPresentation(
  value: MatrixUserID
): Presentation<MatrixUserID> {
  return Object.freeze({
    object: value,
    presentationType: MatrixUserIDPresentationType,
  });
}

TextPresentationRenderer.registerPresentationRenderer<MatrixUserID>(
  MatrixUserIDPresentationType,
  function (presentation) {
    return presentation.object.toString();
  }
);

export const MatrixEventReferencePresentationType = definePresentationType({
  name: "MatrixEventReference",
  validator: function (value): value is MatrixEventReference {
    return (
      value instanceof MatrixEventViaAlias ||
      value instanceof MatrixEventViaRoomID
    );
  },
});

export function makeMatrixEventReferencePresentation(
  value: MatrixEventReference
): Presentation<MatrixEventReference> {
  return Object.freeze({
    object: value,
    presentationType: MatrixEventReferencePresentationType,
  });
}

TextPresentationRenderer.registerPresentationRenderer<MatrixEventReference>(
  MatrixEventReferencePresentationType,
  function (presentation) {
    return `${presentation.object.reference.toPermalink()}/${presentation.object.eventID}`;
  }
);
