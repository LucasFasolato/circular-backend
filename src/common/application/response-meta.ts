export const RESPONSE_META_KEY = '__meta';

export type ResponseWithMeta<T> = T & {
  [RESPONSE_META_KEY]: Record<string, unknown>;
};

export function withResponseMeta<T extends object>(
  data: T,
  meta: Record<string, unknown>,
): ResponseWithMeta<T> {
  return {
    ...data,
    [RESPONSE_META_KEY]: meta,
  };
}

export function hasResponseMeta(
  value: unknown,
): value is ResponseWithMeta<Record<string, unknown>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    RESPONSE_META_KEY in value &&
    typeof (value as Record<string, unknown>)[RESPONSE_META_KEY] === 'object' &&
    (value as Record<string, unknown>)[RESPONSE_META_KEY] !== null
  );
}
