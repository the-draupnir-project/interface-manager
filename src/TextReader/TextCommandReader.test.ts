// SPDX-FileCopyrightText: 2022 - 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import {
  MatrixRoomAlias,
  MatrixUserID,
} from "@the-draupnir-project/matrix-basic-types";
import { readCommand } from "./TextCommandReader";
import { StringPresentationType } from "./TextPresentationTypes";
import { Keyword } from "../Command/Keyword";

test("CommandReader can read strings", function () {
  const readResult = readCommand("hello");
  expect(readResult.length).toBe(1);
  expect(readResult.at(0)).toBeDefined();
  expect(readResult.at(0)?.object).toBe("hello");
  expect(readResult.at(0)?.presentationType).toBe(StringPresentationType);
});

test("CommandReader can read a complex command", function () {
  const readResult = readCommand(
    "!draupnir ban @spam:example.com https://matrix.to/#/#coc:example.com spam --some-flag-idk"
  );
  expect(readResult.at(2)?.object).toBeInstanceOf(MatrixUserID);
  expect(readResult.at(3)?.object).toBeInstanceOf(MatrixRoomAlias);
  expect(readResult.at(5)?.object).toBeInstanceOf(Keyword);
});
