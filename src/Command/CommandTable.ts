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
  sourceTable: CommandTable;
};

export type CommandTableImport = {
  table: CommandTable;
  baseDesignator: string[];
};

export interface CommandTable {
  /**
   * Can be used to render a help command with an index of all the commands.
   * @returns All of the commands in this table.
   */
  getAllCommands(): CommandTableEntry[];

  /**
   * @returns Only the commands interned in this table, excludes imported commands.
   */
  getExportedCommands(): CommandTableEntry[];
  getImportedTables(): CommandTableImport[];
  findAMatchingCommand(
    stream: PresentationArgumentStream
  ): CommandDescription | undefined;
  internCommand(
    command: CommandDescription,
    designator: string[]
  ): CommandTable;
  /**
   * Import the commands from a different table into this one.
   * @param baseDesignator A designator to use as a base for all of the table's
   * commands before importing them. So for example, commands for the join wave
   * short-circuit protection might add a base designator of ["join" "wave"].
   * So the complete designator for a status command that the join wave short-circuit
   * protection defined would be  ["join", "wave", "status"] in this table.
   */
  importTable(table: CommandTable, baseDesignator: string[]): void;
}

export class StandardCommandTable implements CommandTable {
  private readonly exportedCommands = new Set<CommandTableEntry>();
  private readonly flattenedCommands = new Set<CommandTableEntry>();
  private readonly commands: CommandTableEntry = {
    designator: [],
    sourceTable: this,
  };
  /** Imported tables are tables that "add commands" to this table. They are not sub commands. */
  private readonly importedTables = new Map<CommandTable, CommandTableImport>();

  constructor(public readonly name: string | symbol) {}

  /**
   * Can be used to render a help command with an index of all the commands.
   * @returns All of the commands in this table.
   */
  public getAllCommands(): CommandTableEntry[] {
    return [...this.flattenedCommands];
  }

  /**
   * @returns Only the commands interned in this table, excludes imported commands.
   */
  public getExportedCommands(): CommandTableEntry[] {
    return [...this.exportedCommands.values()];
  }

  public getImportedTables(): CommandTableImport[] {
    return [...this.importedTables.values()];
  }

  private findAMatchingCommandEntry(
    stream: PresentationArgumentStream
  ): CommandTableEntry | undefined {
    const tableHelper = (
      startingTableEntry: CommandTableEntry,
      argumentStream: PresentationArgumentStream
    ): undefined | CommandTableEntry => {
      const nextArgument = argumentStream.peekItem();
      if (
        nextArgument === undefined ||
        typeof nextArgument.object !== "string"
      ) {
        // Then they might be using something like "!mjolnir status"
        return startingTableEntry;
      }
      stream.readItem(); // dispose of the argument.
      const entry = startingTableEntry.subCommands?.get(nextArgument.object);
      if (!entry) {
        // The reason there's no match is because this is the command arguments, rather than subcommand notation.
        return startingTableEntry;
      } else {
        return tableHelper(entry, argumentStream);
      }
    };
    return tableHelper(this.commands, stream);
  }

  public findAMatchingCommand(
    stream: PresentationArgumentStream
  ): CommandDescription | undefined {
    const commandTableEntry = stream.savingPositionIf({
      body: (s) =>
        this.findAMatchingCommandEntry(s as PresentationArgumentStream),
      predicate: (command) => command === undefined,
    });
    if (commandTableEntry) {
      return commandTableEntry.currentCommand;
    }
    return undefined;
  }

  private internCommandHelper(
    command: CommandDescription,
    originalTable: CommandTable,
    tableEntry: CommandTableEntry,
    designator: string[]
  ): void {
    const currentDesignator = designator.shift();
    if (currentDesignator === undefined) {
      if (tableEntry.currentCommand) {
        throw new TypeError(
          `There is already a command for ${JSON.stringify(designator)}`
        );
      }
      tableEntry.currentCommand = command;
      if (originalTable === this) {
        this.exportedCommands.add(tableEntry);
      }
      this.flattenedCommands.add(tableEntry);
    } else {
      if (tableEntry.subCommands === undefined) {
        tableEntry.subCommands = new Map();
      }
      const nextLookupEntry =
        tableEntry.subCommands.get(currentDesignator) ??
        ((lookup: CommandTableEntry) => (
          tableEntry.subCommands.set(currentDesignator, lookup), lookup
        ))({ designator: [], sourceTable: this });
      this.internCommandHelper(
        command,
        originalTable,
        nextLookupEntry,
        designator
      );
    }
  }

  public internCommand(
    command: CommandDescription,
    designator: string[]
  ): this {
    this.internCommandHelper(command, this, this.commands, designator);
    return this;
  }

  public importTable(table: CommandTable, baseDesignator: string[]): void {
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
    this.importedTables.set(table, { table, baseDesignator });
    for (const command of table.getAllCommands()) {
      if (command.currentCommand !== undefined) {
        this.internCommandHelper(command.currentCommand, table, this.commands, [
          ...baseDesignator,
          ...command.designator,
        ]);
      }
    }
  }
}
