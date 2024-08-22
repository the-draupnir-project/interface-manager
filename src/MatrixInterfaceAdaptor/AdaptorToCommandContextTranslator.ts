// SPDX-FileCopyrightText: 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { CommandDescription } from "../Command";

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
  translateContext<CommandContext>(
    commandDescription: CommandDescription<CommandContext>,
    adaptorContext: AdaptorContext
  ): CommandContext;
  registerTranslation<CommandContext>(
    commandDescription: CommandDescription<CommandContext>,
    translationFunction: AdaptorToCommandContextTranslationFunction<
      AdaptorContext,
      CommandContext
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
  translateContext<CommandContext>(
    commandDescription: CommandDescription<CommandContext>,
    adaptorContext: AdaptorContext
  ): CommandContext {
    const entry = this.translators.get(
      commandDescription as CommandDescription
    );
    if (entry === undefined) {
      return adaptorContext as unknown as CommandContext;
    } else {
      return entry(adaptorContext) as CommandContext;
    }
  }
  registerTranslation<CommandContext>(
    commandDescription: CommandDescription<CommandContext>,
    translationFunction: AdaptorToCommandContextTranslationFunction<
      AdaptorContext,
      CommandContext
    >
  ): AdaptorToCommandContextTranslator<AdaptorContext> {
    if (this.translators.has(commandDescription as CommandDescription)) {
      throw new TypeError(
        `There is already a translation function registered for the command ${commandDescription.summary}`
      );
    }
    this.translators.set(
      commandDescription as CommandDescription,
      translationFunction
    );
    return this;
  }
}
