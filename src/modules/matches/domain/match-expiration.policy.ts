import { ListingState } from '../../listings/domain/listing-state.enum';
import { MatchSessionEntity } from './match-session.entity';
import { MatchSessionState } from './match-session-state.enum';
import { isMatchActive } from './match-state.policy';

export function shouldExpireMatch(
  match: Pick<MatchSessionEntity, 'state' | 'expiresAt'>,
  now: Date,
): boolean {
  const state = match.state as MatchSessionState;

  return isMatchActive(state) && match.expiresAt <= now;
}

export function deriveListingStateAfterMatchExpiration(
  currentState: ListingState,
): ListingState {
  if (currentState === ListingState.RESERVED) {
    return ListingState.PUBLISHED;
  }

  return currentState;
}
