import { describe, expect, it } from "vitest";
import { openHands } from "#/api/open-hands-axios";

describe("openHands axios client", () => {
  it("serializes array query params without bracket suffixes", () => {
    const uri = openHands.getUri({
      url: "/api/conversations",
      params: {
        ids: ["conversation-1", "conversation-2"],
        limit: 10,
      },
    });

    expect(uri).toContain("/api/conversations?");
    expect(uri).toContain("ids=conversation-1");
    expect(uri).toContain("ids=conversation-2");
    expect(uri).toContain("limit=10");
    expect(uri).not.toContain("ids%5B%5D=");
  });
});
