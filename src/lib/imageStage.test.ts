import { describe, expect, it } from "vitest";
import { stageImage } from "./imageStage";
import { LISTING_MEDIA_ALLOWED_MIME, LISTING_MEDIA_MAX_BYTES } from "@/services/backend";

// jsdom does not decode image bitmaps, so the success path that needs
// Image decoding stays uncovered here and is exercised in the real
// browser. We cover the validation paths.

const ALLOW = LISTING_MEDIA_ALLOWED_MIME;
const LIMIT = LISTING_MEDIA_MAX_BYTES;

function fileOf(type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], "img.dat", { type });
}

describe("stageImage validation", () => {
  it("rejects unsupported mime with kind=unsupported-type", async () => {
    await expect(
      stageImage(fileOf("image/gif", 100), {
        allowedMime: ALLOW,
        maxBytes: LIMIT,
      }),
    ).rejects.toMatchObject({ kind: "unsupported-type" });
  });

  it("rejects oversized files with kind=too-large + limit", async () => {
    await expect(
      stageImage(fileOf("image/jpeg", LIMIT + 1), {
        allowedMime: ALLOW,
        maxBytes: LIMIT,
      }),
    ).rejects.toMatchObject({
      kind: "too-large",
      limitMb: 10,
    });
  });
});
