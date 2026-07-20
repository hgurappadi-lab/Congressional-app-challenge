import { describe, expect, it } from "vitest";
import { CLASSIFICATION_LABELS } from "../src/lib/classification-labels";
import { CLASSIFICATIONS } from "../src/lib/classification";

describe("CLASSIFICATION_LABELS", () => {
  it("has a label for every classification value", () => {
    expect(Object.keys(CLASSIFICATION_LABELS).sort()).toEqual(
      Object.values(CLASSIFICATIONS).sort(),
    );
  });
});
