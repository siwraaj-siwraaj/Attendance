export function bigintReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") {
    return { __bigint__: value.toString() };
  }
  return value;
}

export function bigintReviver(_key: string, value: unknown): unknown {
  if (
    value !== null &&
    typeof value === "object" &&
    "__bigint__" in (value as object)
  ) {
    return BigInt((value as { __bigint__: string }).__bigint__);
  }
  return value;
}

export function safeStringify(value: unknown): string {
  return JSON.stringify(
    value,
    bigintReplacer as (key: string, value: unknown) => unknown,
  );
}

export function safeParse<T = unknown>(text: string): T {
  return JSON.parse(
    text,
    bigintReviver as (key: string, value: unknown) => unknown,
  ) as T;
}
