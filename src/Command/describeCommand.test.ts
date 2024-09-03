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
  StringPresentationType,
} from "../TextReader";
import { ParsedKeywords, StandardParsedKeywords } from "./ParsedKeywords";
import { tuple } from "./ParameterParsing";
import { PromptOptions } from "./PromptForAccept";
import { describeKeywordParameters } from "./KeywordParameterDescription";

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

// DescribeKeywordProperty optionally
// accepts an acceptor only when the type is flag, and replaces that
// with the TopPresentationSchema once its is turned into a KeywordPropertyDescription.
it("Can define keyword arguments.", async function () {
  // so it's at this point that i ralised that we have no ability to test the parseAndInvoke
  // functionality in unit tests here without implementing a MatrixInterfaceAdaptor,
  // or some other adaptor for unit testing.
  // Making that fake probably requires splitting out the arguments to the interface adaptor
  // or the command dispatcher too, so that there's something that has all those callbacks
  // defined on them and they can be optionally implemented by the consumer.
  // That will make it really easy for people to get started using the library without wondering
  // what the hell these 200 dependencies are that they have to instantiate somehow.
  const KeywordsCommandTest = describeCommand({
    summary: "A command to test keyword arguments",
    async executor(
      _context: never,
      _info: unknown,
      keywords: ParsedKeywords
    ): Promise<Result<unknown>> {},
    parameters: [],
    keywords: {
      keywordDescriptions: {
        "dry-run": {
          isFlag: true,
          description:
            "Runs the kick command without actually removing any users.",
        },
        glob: {
          isFlag: true,
          description:
            "Allows globs to be used to kick several users from rooms.",
        },
        room: {
          acceptor: MatrixRoomReferencePresentationSchema,
          description:
            "Allows the command to be scoped to just one protected room.",
        },
      },
    },
  });
});
