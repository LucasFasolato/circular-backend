import { ConversationThreadState } from './conversation-thread-state.enum';
import { MatchSessionState } from './match-session-state.enum';

export const ACTIVE_MATCH_SESSION_STATES = [
  MatchSessionState.OPEN,
  MatchSessionState.ACTIVE,
] as const;

const ACTIVE_MATCH_SESSION_STATE_SET = new Set<MatchSessionState>(
  ACTIVE_MATCH_SESSION_STATES,
);

export function isMatchActive(state: MatchSessionState): boolean {
  return ACTIVE_MATCH_SESSION_STATE_SET.has(state);
}

export function canMatchTransition(
  from: MatchSessionState,
  to: MatchSessionState,
): boolean {
  switch (from) {
    case MatchSessionState.OPEN:
      return [
        MatchSessionState.ACTIVE,
        MatchSessionState.COMPLETED,
        MatchSessionState.FAILED,
        MatchSessionState.EXPIRED,
        MatchSessionState.CANCELLED,
      ].includes(to);
    case MatchSessionState.ACTIVE:
      return [
        MatchSessionState.COMPLETED,
        MatchSessionState.FAILED,
        MatchSessionState.EXPIRED,
        MatchSessionState.CANCELLED,
      ].includes(to);
    case MatchSessionState.COMPLETED:
    case MatchSessionState.FAILED:
    case MatchSessionState.EXPIRED:
    case MatchSessionState.CANCELLED:
      return to === MatchSessionState.CLOSED;
    default:
      return false;
  }
}

export function canConversationTransition(
  from: ConversationThreadState,
  to: ConversationThreadState,
): boolean {
  switch (from) {
    case ConversationThreadState.OPEN:
      return [
        ConversationThreadState.RESTRICTED,
        ConversationThreadState.CLOSED,
      ].includes(to);
    case ConversationThreadState.RESTRICTED:
      return to === ConversationThreadState.CLOSED;
    case ConversationThreadState.CLOSED:
      return to === ConversationThreadState.ARCHIVED;
    default:
      return false;
  }
}
