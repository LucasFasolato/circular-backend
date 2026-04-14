import { InteractionsAppError } from './interactions-app.error';

export function selfInteractionNotAllowedError(): InteractionsAppError {
  return new InteractionsAppError(
    'SELF_INTERACTION_NOT_ALLOWED',
    403,
    'You cannot interact with your own listing.',
  );
}

export function purchaseIntentAlreadyExistsError(): InteractionsAppError {
  return new InteractionsAppError(
    'PURCHASE_INTENT_ALREADY_EXISTS',
    409,
    'An active purchase intent already exists for this listing and user.',
  );
}

export function tradeProposalAlreadyExistsError(): InteractionsAppError {
  return new InteractionsAppError(
    'TRADE_PROPOSAL_ALREADY_EXISTS',
    409,
    'An active trade proposal already exists for this listing and user.',
  );
}

export function tradeProposalInvalidError(
  message: string,
): InteractionsAppError {
  return new InteractionsAppError('TRADE_PROPOSAL_INVALID', 422, message);
}

export function proposedItemNotOwnedError(): InteractionsAppError {
  return new InteractionsAppError(
    'PROPOSED_ITEM_NOT_OWNED',
    403,
    'One or more proposed listings do not belong to the proposer.',
  );
}

export function proposedItemNotAvailableError(): InteractionsAppError {
  return new InteractionsAppError(
    'PROPOSED_ITEM_NOT_AVAILABLE',
    409,
    'One or more proposed listings are not available.',
  );
}

export function proposedItemAlreadyCommittedError(): InteractionsAppError {
  return new InteractionsAppError(
    'PROPOSED_ITEM_ALREADY_COMMITTED',
    409,
    'One or more proposed listings are already committed to another active match.',
  );
}

export function interactionNotActiveError(): InteractionsAppError {
  return new InteractionsAppError(
    'INTERACTION_NOT_ACTIVE',
    409,
    'The interaction is not active.',
  );
}

export function interactionNotResolvableError(): InteractionsAppError {
  return new InteractionsAppError(
    'INTERACTION_NOT_RESOLVABLE',
    409,
    'The interaction cannot be resolved in its current state.',
  );
}
