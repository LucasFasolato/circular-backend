import { ModerationReasonCode } from './moderation-reason-code.enum';

export interface ModerationReason {
  code: ModerationReasonCode;
  message: string;
}
