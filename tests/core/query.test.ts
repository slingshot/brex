import { describe, expect, test } from "bun:test";
import { serializeQuery } from "../../src/core/query";

describe("serializeQuery", () => {
  test("returns empty string for undefined or empty query", () => {
    expect(serializeQuery(undefined)).toBe("");
    expect(serializeQuery({})).toBe("");
  });

  test("serializes scalars", () => {
    expect(serializeQuery({ name: "Acme Inc", limit: 100, archived: false })).toBe(
      "?name=Acme+Inc&limit=100&archived=false",
    );
  });

  test("skips null and undefined values", () => {
    expect(serializeQuery({ cursor: undefined, name: null, limit: 5 })).toBe("?limit=5");
  });

  test("repeats the key verbatim for arrays (bracket-style names preserved)", () => {
    expect(serializeQuery({ "expand[]": ["merchant", "budget"] })).toBe(
      "?expand%5B%5D=merchant&expand%5B%5D=budget",
    );
  });

  test("repeats bare keys for arrays too", () => {
    expect(serializeQuery({ ids: ["a", "b"] })).toBe("?ids=a&ids=b");
  });

  test("skips null entries inside arrays", () => {
    expect(serializeQuery({ ids: ["a", null, "b", undefined] })).toBe("?ids=a&ids=b");
  });
});
