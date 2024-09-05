// SPDX-FileCopyrightText: 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from @the-draupnir-project/interface-manager
// https://github.com/the-draupnir-project/interface-manager
// </text>

import { isError } from "@gnuxie/typescript-result";
import {
  BasicInvocationInformation,
  InvocationInformationFromEventContext,
  MatrixInterfaceAdaptor,
} from "./MatrixInterfaceAdaptor";
import {
  CommandDescription,
  CommandTable,
  PresentationArgumentStream,
} from "../Command";
import { StandardCommandDispatcher } from "../TextReader/StandardCommandDispatcher";
import { CommandDispatcherCallbacks } from "../Adaptor";

export interface MatrixInterfaceCommandDispatcher<MatrixEventContext> {
  handleCommandMessageEvent(
    eventContext: MatrixEventContext,
    body: string
  ): void;
  handleCommandFromPresentationStream(
    eventContext: MatrixEventContext,
    stream: PresentationArgumentStream
  ): void;
}

export class StandardMatrixInterfaceCommandDispatcher<
  AdaptorContext,
  MatrixEventContext,
> implements MatrixInterfaceCommandDispatcher<MatrixEventContext>
{
  private readonly baseDispatcher: StandardCommandDispatcher<BasicInvocationInformation>;
  public constructor(
    private readonly interfaceAdaptor: MatrixInterfaceAdaptor<
      AdaptorContext,
      MatrixEventContext
    >,
    private readonly adaptorContext: AdaptorContext,
    private readonly commandTable: CommandTable,
    private readonly helpCommand: CommandDescription,
    private readonly invocationInformationFromEventContext: InvocationInformationFromEventContext<MatrixEventContext>,
    callbacks?: CommandDispatcherCallbacks<BasicInvocationInformation>
  ) {
    this.baseDispatcher =
      new StandardCommandDispatcher<BasicInvocationInformation>(
        this.commandTable,
        this.helpCommand,
        callbacks ?? {}
      );
  }

  handleCommandFromPresentationStream(
    eventContext: MatrixEventContext,
    stream: PresentationArgumentStream
  ): void {
    const partialCommand = this.baseDispatcher.parsePartialCommandFromStream(
      this.invocationInformationFromEventContext(eventContext),
      stream
    );
    if (isError(partialCommand)) {
      return; // callbacks should be handled by the baseDispatcher already.
    }
    void this.interfaceAdaptor.parseAndInvoke(
      partialCommand.ok,
      this.adaptorContext,
      eventContext
    );
  }

  handleCommandMessageEvent(
    eventContext: MatrixEventContext,
    body: string
  ): void {
    const partialCommand = this.baseDispatcher.parsePartialCommandFromBody(
      this.invocationInformationFromEventContext(eventContext),
      body
    );
    if (isError(partialCommand)) {
      return; // callbacks should be handled by the baseDispatcher already.
    }
    void this.interfaceAdaptor.parseAndInvoke(
      partialCommand.ok,
      this.adaptorContext,
      eventContext
    );
  }
}
