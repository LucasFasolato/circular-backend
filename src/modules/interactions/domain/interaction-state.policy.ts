import { MatchSessionState } from './match-session-state.enum';
import { PurchaseIntentState } from './purchase-intent-state.enum';
import { TradeProposalState } from './trade-proposal-state.enum';

export const ACTIVE_PURCHASE_INTENT_STATES = [
  PurchaseIntentState.ACTIVE,
] as const;
export const TERMINAL_PURCHASE_INTENT_STATES = [
  PurchaseIntentState.REJECTED,
  PurchaseIntentState.CANCELLED,
  PurchaseIntentState.EXPIRED,
  PurchaseIntentState.CLOSED,
] as const;

export const ACTIVE_TRADE_PROPOSAL_STATES = [
  TradeProposalState.ACTIVE,
] as const;
export const TERMINAL_TRADE_PROPOSAL_STATES = [
  TradeProposalState.REJECTED,
  TradeProposalState.CANCELLED,
  TradeProposalState.EXPIRED,
  TradeProposalState.CLOSED,
] as const;

export const ACTIVE_MATCH_SESSION_STATES = [
  MatchSessionState.OPEN,
  MatchSessionState.ACTIVE,
] as const;

export function isPurchaseIntentActive(state: PurchaseIntentState): boolean {
  return state === PurchaseIntentState.ACTIVE;
}

export function isTradeProposalActive(state: TradeProposalState): boolean {
  return state === TradeProposalState.ACTIVE;
}
