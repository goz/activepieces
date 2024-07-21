import React from 'react';

import {
  RightSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UNSAVED_CHANGES_TOAST, useToast } from '@/components/ui/use-toast';
import { flowVersionUtils } from '@/features/flows/lib/flow-version-util';
import { PieceCardInfo } from '@/features/pieces/components/piece-card-info';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { ActionErrorHandlingForm } from '@/features/properties-form/components/action-error-handling';
import {
  Action,
  ActionType,
  FlowOperationType,
  TriggerType,
  flowHelper,
} from '@activepieces/shared';

import { SidebarHeader } from '../sidebar-header';
import { TestActionComponent } from '../test-step/test-action';

import { BranchSettings } from './branch-settings';
import { CodeSettings } from './code-settings';
import { LoopsSettings } from './loops-settings';

const STEPS_WITH_ERROR_HANDLING: (ActionType | TriggerType)[] = [
  ActionType.CODE,
];

const StepSettingsContainer = React.memo(() => {
  const { setRightSidebar, applyOperation, readonly } = useBuilderStateContext(
    (state) => state,
  );

  const { toast } = useToast();

  const selectedStep = useBuilderStateContext((state) => {
    const { selectedStep } = state;
    if (!selectedStep) {
      return null;
    }
    return flowHelper.getStep(state.flowVersion, selectedStep.stepName!)!;
  });

  if (!selectedStep) {
    return <></>;
  }

  const { data: pieceMetadata } = piecesHooks.usePieceMetadata({
    step: selectedStep,
  });

  const updateAction = (newAction: Action) => {
    applyOperation(
      {
        type: FlowOperationType.UPDATE_ACTION,
        request: newAction,
      },
      () => toast(UNSAVED_CHANGES_TOAST),
    );
  };

  const handleOnErrorChanges = (
    continueOnFailure: boolean | undefined,
    retryOnFailure: boolean | undefined,
  ) => {
    const newAction = flowVersionUtils.buildActionWithErrorOptions(
      selectedStep,
      {
        continueOnFailure,
        retryOnFailure,
      },
    );
    updateAction(newAction);
  };

  // TODO check scrolling code editior
  return (
    <>
      <SidebarHeader onClose={() => setRightSidebar(RightSideBarType.NONE)}>
        {selectedStep.displayName}
      </SidebarHeader>
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={75}>
          <ScrollArea className="h-full p-4 ">
            <div className="flex flex-col gap-4">
              <PieceCardInfo piece={pieceMetadata!} />
              {selectedStep.type === ActionType.LOOP_ON_ITEMS && (
                <LoopsSettings
                  selectedStep={selectedStep}
                  onUpdateAction={updateAction}
                ></LoopsSettings>
              )}
              {selectedStep.type === ActionType.CODE && (
                <CodeSettings
                  selectedStep={selectedStep}
                  onUpdateAction={updateAction}
                  readonly={readonly}
                ></CodeSettings>
              )}
              {selectedStep.type === ActionType.BRANCH && (
                <BranchSettings selectedStep={selectedStep}></BranchSettings>
              )}
              {STEPS_WITH_ERROR_HANDLING.includes(selectedStep.type) && (
                <ActionErrorHandlingForm
                  errorHandlingOptions={{
                    continueOnFailure: {
                      defaultValue:
                        selectedStep.settings.errorHandlingOptions
                          ?.continueOnFailure?.value ?? false,
                      hide: false,
                    },
                    retryOnFailure: {
                      defaultValue:
                        selectedStep.settings.errorHandlingOptions
                          ?.retryOnFailure?.value ?? false,
                      hide: false,
                    },
                  }}
                  onContinueOnFailureChange={(value) =>
                    handleOnErrorChanges(value, undefined)
                  }
                  onRetryOnFailureChange={(value) =>
                    handleOnErrorChanges(undefined, value)
                  }
                ></ActionErrorHandlingForm>
              )}
            </div>
          </ScrollArea>
        </ResizablePanel>
        {!readonly && (
          <>
            <ResizableHandle withHandle={true} />
            <ResizablePanel defaultSize={25}>
              <ScrollArea className="h-full">
                <div className="p-4 flex flex-col gap-4 h-full">
                  {flowHelper.isAction(selectedStep.type) && (
                    <TestActionComponent
                      selectedStep={selectedStep as Action}
                    ></TestActionComponent>
                  )}
                </div>
              </ScrollArea>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </>
  );
});

StepSettingsContainer.displayName = 'StepSettings';
export { StepSettingsContainer as StepSettings };
