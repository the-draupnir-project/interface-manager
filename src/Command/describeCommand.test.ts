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
  MatrixRoomIDPresentationType,
  MatrixRoomReferencePresentationSchema,
  MatrixUserIDPresentationType,
} from "../TextReader";
import { StandardParsedKeywords } from "./ParsedKeywords";
import { tuple } from "./ParameterParsing";
import { PromptOptions } from "./PromptForAccept";

it("Can define and execute commands.", async function () {
  type Context = {
    banUser(
      room: MatrixRoomReference,
      user: MatrixUserID
    ): Promise<Result<boolean>>;
    getProtectedRooms(): MatrixRoomID[];
  };
  // i think what we have to do is split describeCommand into two parts :(
  // The first extracts the parameters and possibly accepts the `context` as a type parmater.
  // then the function it returns accepts the executor.
  const BanCommand = describeCommand({
    summary: "Ban a user from a room",
    async executor(
      context: Context,
      _info,
      _keywords,
      _rest,
      user,
      room
    ): Promise<Result<boolean>> {
      return await context.banUser(room, user);
    },
    parameters: tuple(
      {
        name: "user",
        acceptor: MatrixUserIDPresentationType,
      },
      {
        name: "target room",
        acceptor: MatrixRoomReferencePresentationSchema,
        async prompt(
          context: Context
        ): Promise<Result<PromptOptions<MatrixRoomID>>> {
          return Ok({
            suggestions: context
              .getProtectedRooms()
              .map((room) => MatrixRoomIDPresentationType.wrap(room)),
          });
        },
      }
    ),
  });
  const banResult = await BanCommand.executor(
    {
      async banUser(room, user) {
        expect(room.toRoomIDOrAlias()).toBe("!foo:example.com");
        expect(user.toString()).toBe("@foo:example.com");
        return Ok(true);
      },
      getProtectedRooms() {
        return [new MatrixRoomID("!foo:example.com")];
      },
    },
    {},
    new StandardParsedKeywords(
      BanCommand.parametersDescription.keywords,
      new Map()
    ),
    [],
    new MatrixUserID("@foo:example.com" as StringUserID),
    MatrixRoomReference.fromRoomID("!foo:example.com" as StringRoomID, [])
  );
  expect(isOk(banResult)).toBe(true);
});
