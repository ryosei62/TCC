// api/cloudinary-delete.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { v2 as cloudinary } from "cloudinary";
import admin from "firebase-admin";

type Body =
  | { type: "post"; communityId: string; postId: string }
  | { type: "community"; communityId: string };

function initFirebaseAdmin() {
  if (admin.apps.length) return;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}

function initCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });
}

// 代表者しか削除できるUIにしている前提でも、念のためサーバ側で認証するのがおすすめ
async function requireAuth(req: VercelRequest) {
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer (.+)$/);
  if (!m) throw new Error("missing Authorization Bearer token");
  return admin.auth().verifyIdToken(m[1]); // { uid, ... }
}

async function destroyMany(publicIds: string[]) {
  const unique = Array.from(new Set(publicIds.filter(Boolean)));
  return Promise.all(
    unique.map(async (publicId) => {
      const r = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
      });
      // result: "ok" / "not found" / ...
      return { publicId, result: r.result };
    })
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    initFirebaseAdmin();
    initCloudinary();

    const { uid } = await requireAuth(req);
    const body = req.body as Body;

    const db = admin.firestore();

    if (body.type === "post") {
      const { communityId, postId } = body;

      const communityRef = db.collection("communities").doc(communityId);
      const postRef = communityRef.collection("posts").doc(postId);

      const [cSnap, pSnap] = await Promise.all([communityRef.get(), postRef.get()]);
      if (!cSnap.exists) return res.status(404).json({ error: "community not found" });
      if (!pSnap.exists) return res.status(404).json({ error: "post not found" });

      const c = cSnap.data() as any;
      if (c?.createdBy !== uid) return res.status(403).json({ error: "forbidden" });

      const p = pSnap.data() as any;
      const ids: string[] = [];
      if (p?.imagePublicId) ids.push(p.imagePublicId);

      const deleted = await destroyMany(ids);
      return res.status(200).json({ ok: true, deleted });
    }

    if (body.type === "community") {
      const { communityId } = body;

      const communityRef = db.collection("communities").doc(communityId);
      const cSnap = await communityRef.get();
      if (!cSnap.exists) return res.status(404).json({ error: "community not found" });

      const c = cSnap.data() as any;
      if (c?.createdBy !== uid) return res.status(403).json({ error: "forbidden" });

      // community本体の画像
      const ids: string[] = [];
      if (Array.isArray(c?.imagePublicIds)) ids.push(...c.imagePublicIds);
      if (c?.thumbnailPublicId) ids.push(c.thumbnailPublicId);

      // posts サブコレの画像も回収
      const postsSnap = await communityRef.collection("posts").get();
      postsSnap.forEach((d) => {
        const p = d.data() as any;
        if (p?.imagePublicId) ids.push(p.imagePublicId);
      });

      const deleted = await destroyMany(ids);
      return res.status(200).json({ ok: true, deleted, count: deleted.length });
    }

    return res.status(400).json({ error: "invalid type" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "internal error" });
  }
}
