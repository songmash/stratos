import { ActionOrchestrator } from './action-orchestrator';
import { IRequestAction } from '../../../../../store/src/types/request.types';
import { PaginatedAction } from '../../../../../store/src/types/pagination.types';

const BASE_ACTIONS = [
  'get',
  'delete',
  'update',
  'create',
  'getAll'
];
const fakeActions = [
  'myMadeUpAction1',
  'myMadeUpAction2'
];

function assertActions(actionOrchestrator: ActionOrchestrator, actionsNotToHave: string[], actionsToHave?: string[]) {
  actionsNotToHave.forEach(action => expect(actionOrchestrator.hasActionBuilder(action)).toBe(false));
  if (actionsToHave) {
    actionsToHave.forEach(action => expect(actionOrchestrator.hasActionBuilder(action)).toBe(true));
  }
}

export function getBaseActionKeys() {
  return [...BASE_ACTIONS];
}

export function hasActions(actionOrchestrator: ActionOrchestrator, expectToHave?: string[]) {
  const baseActions = getBaseActionKeys();
  const baseActionsToNotHave = expectToHave ? getBaseActionKeys().reduce((actions, action) => {
    if (!expectToHave.find((expectAction) => expectAction === action)) {
      actions.push(action);
    }
    return actions;
  }, [] as string[]) : baseActions;
  assertActions(actionOrchestrator, [
    ...baseActionsToNotHave,
    ...fakeActions
  ], expectToHave);
}

export function getRequestAction() {
  return {} as IRequestAction;
}

export function getPaginationAction() {
  return {} as PaginatedAction;
}
