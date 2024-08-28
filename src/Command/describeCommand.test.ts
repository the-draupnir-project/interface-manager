// Copyright 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import {
  MatrixRoomID,
  MatrixRoomReference,
  MatrixUserID,
  StringRoomID,
  StringUserID,
} from "@the-draupnir-project/matrix-basic-types";
import { describeCommand } from "./describeCommand";
import { Ok, Result, isOk } from "@gnuxie/typescript-result";
import {
  MatrixRoomReferencePresentationType,
  MatrixUserIDPresentationType,
} from "../TextReader";
import { StandardParsedKeywords } from "./ParsedKeywords";

it("Can define and execute commands.", async function () {
  type Context = {
    banUser(
      room: MatrixRoomReference,
      user: MatrixUserID
    ): Promise<Result<boolean>>;
  };
  const BanCommand = describeCommand({
    summary: "Ban a user from a room",
    async executor(
      context: Context,
      _keywords,
      user,
      room
    ): Promise<Result<boolean>> {
      return await context.banUser(room, user);
    },
    parameters: [
      {
        name: "user",
        acceptor: MatrixUserIDPresentationType,
      },
      {
        name: "target room",
        acceptor: MatrixRoomReferencePresentationType,
      },
    ],
  });
  const banResult = await BanCommand.executor(
    {
      async banUser(room, user) {
        expect(room.toRoomIDOrAlias()).toBe("!foo:example.com");
        expect(user.toString()).toBe("@foo:example.com");
        return Ok(true);
      },
    },
    new StandardParsedKeywords(
      BanCommand.parametersDescription.keywords,
      new Map()
    ),
    new MatrixUserID("@foo:example.com" as StringUserID),
    MatrixRoomReference.fromRoomID("!foo:example.com" as StringRoomID, [])
  );
  expect(isOk(banResult)).toBe(true);
});
