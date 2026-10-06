import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/guards";
import { env } from "@/server/env";
import { ok, parseJson, route } from "@/server/http";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Returns a short-lived presigned PUT URL.
 * The browser uploads directly to Cloudflare R2.
 */
export const POST = route(async (req) => {
  await requireAdmin();

  const { contentType, size } = await parseJson(
    req,
    z.object({
      contentType: z.enum([
        "image/jpeg",
        "image/png",
        "image/webp",
      ]),
      size: z
        .number()
        .int()
        .positive()
        .max(5 * 1024 * 1024),
    })
  );

  const s3 = new S3Client({
    region: env.s3.region || "auto",
    endpoint: env.s3.endpoint || undefined,

    credentials: {
      accessKeyId: env.s3.accessKeyId,
      secretAccessKey: env.s3.secretAccessKey,
    },

    // Cloudflare R2 does not need automatic AWS checksum
    // middleware for this presigned browser upload.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  const key = `uploads/${new Date().getFullYear()}/${randomUUID()}.${EXT[contentType]}`;

  const command = new PutObjectCommand({
    Bucket: env.s3.bucket,
    Key: key,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: 120,
  });

  return ok({
    uploadUrl,
    publicUrl: `${env.s3.publicBase}/${key}`,
  });
});
