import { MatchesAppError } from './matches-app.error';

export function matchNotFoundError(): MatchesAppError {
  return new MatchesAppError(
    'MATCH_NOT_FOUND',
    404,
    'Match session not found.',
  );
}

export function matchAlreadyClosedError(): MatchesAppError {
  return new MatchesAppError(
    'MATCH_ALREADY_CLOSED',
    409,
    'The match session is already closed.',
  );
}

export function matchNotConfirmableError(): MatchesAppError {
  return new MatchesAppError(
    'MATCH_NOT_CONFIRMABLE',
    409,
    'The match session cannot be confirmed in its current state.',
  );
}

export function conversationNotFoundError(): MatchesAppError {
  return new MatchesAppError(
    'CONVERSATION_NOT_FOUND',
    404,
    'Conversation thread not found.',
  );
}

export function conversationClosedError(): MatchesAppError {
  return new MatchesAppError(
    'CONVERSATION_CLOSED',
    409,
    'The conversation is closed.',
  );
}

export function quickActionNotAllowedError(): MatchesAppError {
  return new MatchesAppError(
    'QUICK_ACTION_NOT_ALLOWED',
    409,
    'The quick action is not allowed for this match.',
  );
}
