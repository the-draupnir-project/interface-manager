// SPDX-FileCopyrightText: 2025 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { CommandDescription } from "../Command";
import {
  AsyncCommandResultCB,
  JSONInterfaceAdaptor,
} from "./JSONInterfaceAdaptor";
import { JSONRendererDescription } from "./JSONRendererDescription";

export class StandardJSONInterfaceAdaptor<AdaptorContext, InvocationContext>
  implements JSONInterfaceAdaptor<AdaptorContext, InvocationContext>
{
  private readonly renderers = new Map<
    CommandDescription,
    JSONRendererDescription
  >();

  constructor(private readonly defaultRenderer: JSONRendererDescription) {
    // nothing to do.
  }

  public asyncParseThenInvoke(
    jsonBody: Record<string, unknown>,
    context: AdaptorContext,
    invocationInfo: InvocationContext,
    cb: AsyncCommandResultCB
  ) {
    // to do this properly we need to call the parser on the JSON body.
    // that should return a presentation argument stream from which we
    // can create a partial command.
    // From there we just do the ususal stuff.
  }
}
