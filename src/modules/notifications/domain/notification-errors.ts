import { NotificationsAppError } from './notifications-app.error';

export function notificationNotFoundError(): NotificationsAppError {
  return new NotificationsAppError(
    'NOTIFICATION_NOT_FOUND',
    404,
    'Notification not found.',
  );
}
