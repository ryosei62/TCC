import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  collectionGroup,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDoc,
  doc as fsDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

type TimelinePost = {
  id: string;
  title?: string;
  body?: string;
  imageUrl?: string;
  createdAt?: Timestamp | null;
  isPinned?: boolean;

  // 追加情報（パスから復元）
  communityId: string;
};

export const TimelinePage = () => {
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [loading, setLoading] = useState(true);

  // communityId -> communityName のキャッシュ
  const [communityNameMap, setCommunityNameMap] = useState<Record<string, string>>({});
  const fetchingSetRef = useRef<Set<string>>(new Set());

  const formatDate = (ts?: Timestamp | null) => {
    if (!ts) return "";
    return ts.toDate().toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ① 全 posts を createdAt 降順で取得（最新が上）
  useEffect(() => {
    const q = query(
      collectionGroup(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: TimelinePost[] = snapshot.docs.map((d) => {
          // communities/{communityId}/posts/{postId} なので、親の親が communities/{communityId}
          const communityId = d.ref.parent.parent?.id ?? "";

          const data = d.data() as any;
          return {
            id: d.id,
            title: data.title,
            body: data.body,
            imageUrl: data.imageUrl,
            createdAt: data.createdAt ?? null,
            isPinned: data.isPinned ?? false,
            communityId,
          };
        });

        setPosts(list);
        setLoading(false);
      },
      (err) => {
        console.error("Timeline snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // ② 表示に必要なコミュニティ名をまとめて引く（キャッシュ）
  useEffect(() => {
    const uniqueCommunityIds = Array.from(
      new Set(posts.map((p) => p.communityId).filter(Boolean))
    );

    const fetchNeeded = async () => {
      const toFetch = uniqueCommunityIds.filter(
        (cid) => !communityNameMap[cid] && !fetchingSetRef.current.has(cid)
      );
      if (toFetch.length === 0) return;

      // fetch中フラグ
      toFetch.forEach((cid) => fetchingSetRef.current.add(cid));

      try {
        const results = await Promise.all(
          toFetch.map(async (cid) => {
            const snap = await getDoc(fsDoc(db, "communities", cid));
            const name = snap.exists() ? (snap.data() as any).name ?? "（無名コミュニティ）" : "（削除済み）";
            return [cid, name] as const;
          })
        );

        setCommunityNameMap((prev) => {
          const next = { ...prev };
          results.forEach(([cid, name]) => (next[cid] = name));
          return next;
        });
      } finally {
        // fetch中フラグ解除
        toFetch.forEach((cid) => fetchingSetRef.current.delete(cid));
      }
    };

    fetchNeeded();
  }, [posts, communityNameMap]);

  const hasPosts = useMemo(() => posts.length > 0, [posts]);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1 style={{ margin: 0 }}>タイムライン</h1>
        <Link to="/" style={{ textDecoration: "underline" }}>← 一覧へ戻る</Link>
      </div>

      {loading ? (
        <p style={{ marginTop: 16 }}>読み込み中...</p>
      ) : !hasPosts ? (
        <p style={{ marginTop: 16 }}>まだ投稿がありません。</p>
      ) : (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {posts.map((p) => {
            const communityName = p.communityId ? (communityNameMap[p.communityId] ?? "（読み込み中…）") : "（不明）";
            return (
              <article
                key={`${p.communityId}_${p.id}`}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 14,
                  background: "#fff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      <Link to={`/communities/${p.communityId}`} style={{ textDecoration: "underline" }}>
                        {communityName}
                      </Link>
                      {p.createdAt ? <span> ・ {formatDate(p.createdAt)}</span> : null}
                    </div>

                    <h3 style={{ margin: "6px 0 6px", fontSize: 18, lineHeight: 1.3 }}>
                      {p.title ?? "（タイトルなし）"}
                    </h3>

                    {p.body ? (
                      <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                        {p.body}
                      </p>
                    ) : null}
                  </div>

                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt=""
                      style={{
                        width: 120,
                        height: 90,
                        objectFit: "cover",
                        borderRadius: 10,
                        flexShrink: 0,
                      }}
                    />
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
