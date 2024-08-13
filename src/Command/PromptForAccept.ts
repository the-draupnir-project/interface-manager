// Copyright 2023 - 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { Presentation } from "./Presentation";
import { StandardPresentationArgumentStream } from "./PresentationStream";

// what i'm worried about this is that when defining commands outside the context
// of the interface adaptor, we can't specify presentation types easily.
// surely prompts are specific to the adaptor and not the command? idk.
// saying what the prompts can be isn't part of the adaptor, like this.
// but saying how to present them (their presentation types)is part of the adaptor
// hopefully we can just include a simple wrap prompts with thing.
// Maybe we also just include some dumb option to work that all out for us
// in the adaptor, like `printReadbly` kinda does at the moment in Draupnir.
export interface PromptOptions<ObjectType = unknown> {
  readonly suggestions: ObjectType[];
  readonly default?: ObjectType;
}

/**
 * The idea is that the InterfaceAcceptor can use the presentation type
 * to derive the prompt, or use the prompt given by the ParameterDescription.
 */
export interface InterfaceAcceptor {
  readonly isPromptable: boolean;
}

export class PromptableArgumentStream extends StandardPresentationArgumentStream {
  constructor(
    source: Presentation[],
    private readonly interfaceAcceptor: InterfaceAcceptor,
    start = 0
  ) {
    super([...source], start);
  }
  public rest() {
    return this.source.slice(this.position);
  }

  public isPromptable(): boolean {
    return this.interfaceAcceptor.isPromptable;
  }
}
