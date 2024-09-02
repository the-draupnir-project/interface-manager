// SPDX-FileCopyrightText: 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { CommandDescription } from "../Command";
import { CommandMeta } from "../Command/CommandMeta";

/**
 * This is used to add clue code to take what is essentially a god context into a more specific
 * attenuated one that can be unit tested easily.
 * So basically, rather than giving a command the entirity of Draupnir, we can
 * give it juts the capability to ban a user. Which simplifies test setup.
 */
export type AdaptorToCommandContextTranslationFunction<
  AdaptorContext,
  CommandContext,
> = (adaptorContext: AdaptorContext) => CommandContext;

export interface AdaptorToCommandContextTranslator<AdaptorContext> {
  translateContext<TCommandMeta extends CommandMeta>(
    commandDescription: CommandDescription<TCommandMeta>,
    adaptorContext: AdaptorContext
  ): TCommandMeta["context"];
  registerTranslation<TCommandMeta extends CommandMeta>(
    commandDescription: CommandDescription<TCommandMeta>,
    translationFunction: AdaptorToCommandContextTranslationFunction<
      AdaptorContext,
      TCommandMeta["context"]
    >
  ): AdaptorToCommandContextTranslator<AdaptorContext>;
}

export class StandardAdaptorToCommandContextTranslator<AdaptorContext>
  implements AdaptorToCommandContextTranslator<AdaptorContext>
{
  private readonly translators = new Map<
    CommandDescription,
    AdaptorToCommandContextTranslationFunction<AdaptorContext, unknown>
  >();
  translateContext<TCommandMeta extends CommandMeta>(
    commandDescription: CommandDescription<TCommandMeta>,
    adaptorContext: AdaptorContext
  ): TCommandMeta["context"] {
    const entry = this.translators.get(
      // i really don't care.
      commandDescription as unknown as CommandDescription
    );
    if (entry === undefined) {
      return adaptorContext as unknown as TCommandMeta["context"];
    } else {
      return entry(adaptorContext) as TCommandMeta["context"];
    }
  }
  registerTranslation<TCommandMeta extends CommandMeta>(
    commandDescription: CommandDescription<TCommandMeta>,
    translationFunction: AdaptorToCommandContextTranslationFunction<
      AdaptorContext,
      TCommandMeta["context"]
    >
  ): AdaptorToCommandContextTranslator<AdaptorContext> {
    if (
      this.translators.has(commandDescription as unknown as CommandDescription)
    ) {
      throw new TypeError(
        `There is already a translation function registered for the command ${commandDescription.summary}`
      );
    }
    this.translators.set(
      commandDescription as unknown as CommandDescription,
      translationFunction
    );
    return this;
  }
}
