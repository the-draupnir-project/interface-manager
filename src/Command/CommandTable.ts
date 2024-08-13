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

import { makeStringPresentation } from "../TextReader/TextPresentationTypes";
import { CommandDescription } from "./CommandDescription";
import {
  PresentationArgumentStream,
  StandardPresentationArgumentStream,
} from "./PresentationStream";

export type CommandTableEntry = {
  subCommands?: Map<string, CommandTableEntry>;
  currentCommand?: CommandDescription;
  designator: string[];
};

export class CommandTable {
  private readonly flattenedCommands = new Set<CommandTableEntry>();
  private readonly commands: CommandTableEntry = {
    designator: [],
  };
  /** Imported tables are tables that "add commands" to this table. They are not sub commands. */
  private readonly importedTables = new Set<CommandTable>();

  constructor(public readonly name: string | symbol) {}

  /**
   * Can be used to render a help command with an index of all the commands.
   * @returns All of the commands in this table.
   */
  public getAllCommands(): CommandTableEntry[] {
    const importedCommands = [...this.importedTables].reduce<
      CommandTableEntry[]
    >((acc, t) => [...acc, ...t.getAllCommands()], []);
    return [...this.getExportedCommands(), ...importedCommands];
  }

  /**
   * @returns Only the commands interned in this table, excludes imported commands.
   */
  public getExportedCommands(): CommandTableEntry[] {
    return [...this.flattenedCommands.values()];
  }

  public getImportedTables(): CommandTable[] {
    return [...this.importedTables];
  }

  // We use the argument stream so that they can use stream.rest() to get the unconsumed arguments.
  public findAnExportedMatchingCommand(stream: PresentationArgumentStream) {
    const tableHelper = (
      table: CommandTableEntry,
      argumentStream: PresentationArgumentStream
    ): undefined | CommandDescription => {
      const nextArgument = argumentStream.peekItem();
      if (
        nextArgument === undefined ||
        typeof nextArgument.object !== "string"
      ) {
        // Then they might be using something like "!mjolnir status"
        return table.currentCommand;
      }
      stream.readItem(); // dispose of the argument.
      const entry = table.subCommands?.get(nextArgument.object);
      if (!entry) {
        // The reason there's no match is because this is the command arguments, rather than subcommand notation.
        return table.currentCommand;
      } else {
        return tableHelper(entry, argumentStream);
      }
    };
    return tableHelper(this.commands, stream);
  }

  public findAMatchingCommand(
    stream: PresentationArgumentStream
  ): CommandDescription | undefined {
    const possibleExportedCommand = stream.savingPositionIf({
      // FIXME: we need to fix this upstream to return s as this and not StandardSuperCoolStream.
      body: (s) =>
        this.findAnExportedMatchingCommand(s as PresentationArgumentStream),
      predicate: (command) => command === undefined,
    });
    if (possibleExportedCommand) {
      return possibleExportedCommand;
    }
    for (const table of this.importedTables.values()) {
      const possibleCommand: CommandDescription | undefined =
        stream.savingPositionIf<CommandDescription | undefined>({
          body: (s) =>
            table.findAMatchingCommand(s as PresentationArgumentStream),
          predicate: (command) => command === undefined,
        });
      if (possibleCommand) {
        return possibleCommand;
      }
    }
    return undefined;
  }

  public internCommand(command: CommandDescription, designator: string[]) {
    const internCommandHelper = (
      table: CommandTableEntry,
      designator: string[]
    ): void => {
      const currentDesignator = designator.shift();
      if (currentDesignator === undefined) {
        if (table.currentCommand) {
          throw new TypeError(
            `There is already a command for ${JSON.stringify(designator)}`
          );
        }
        table.currentCommand = command;
        this.flattenedCommands.add(table);
      } else {
        if (table.subCommands === undefined) {
          table.subCommands = new Map();
        }
        const nextLookupEntry =
          table.subCommands.get(currentDesignator) ??
          ((lookup: CommandTableEntry) => (
            table.subCommands.set(currentDesignator, lookup), lookup
          ))({ designator: [] });
        internCommandHelper(nextLookupEntry, designator);
      }
    };
    internCommandHelper(this.commands, designator);
  }

  public importTable(table: CommandTable): void {
    for (const commandTableEntry of table.getAllCommands()) {
      if (
        this.findAMatchingCommand(
          new StandardPresentationArgumentStream(
            commandTableEntry.designator.map(makeStringPresentation)
          )
        )
      ) {
        throw new TypeError(
          `Command ${JSON.stringify(commandTableEntry.designator)} is in conflict with this table and cannot be imported.`
        );
      }
    }
    this.importedTables.add(table);
  }
}
