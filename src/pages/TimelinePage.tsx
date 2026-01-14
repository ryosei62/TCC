import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toggleLike } from "../component/LikeButton";
import {
  collectionGroup,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDoc,
  getDocs,
  doc as fsDoc,
  Timestamp,
  where,
  doc,
  collection,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase/config";
import "./Timeline.css";

type TimelinePost = {
  id: string;
  title?: string;
  body?: string;
  imageUrl?: string;
  createdAt?: Timestamp | null;
  isPinned?: boolean;
  timeline?: boolean;
  likesCount?: number;
  communityId: string;
};

type SortType = "new" | "like";

export const TimelinePage = () => {
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [loading, setLoading] = useState(true);

  // ログインユーザー（uidを安定して取る）
  const [uid, setUid] = useState<string | null>(null);

  // いいね状態: key = `${communityId}_${postId}`
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  // ソート状態（★コンポーネント内に置く）
  const [sortType, setSortType] = useState<SortType>("new");

  // communityId -> communityName のキャッシュ
  const [communityNameMap, setCommunityNameMap] = useState<Record<string, string>>({});
  const fetchingSetRef = useRef<Set<string>>(new Set());

  const [favOnly, setFavOnly] = useState(false);
  const [favoriteCommunitySet, setFavoriteCommunitySet] = useState<Set<string>>(new Set());
  const [favoriteLoading, setFavoriteLoading] = useState(false);


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

  // Auth購読（uidをstateに）
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  // ① timeline==true の posts を createdAt 降順で取得
  useEffect(() => {
    const q = query(
      collectionGroup(db, "posts"),
      where("timeline", "==", true),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: TimelinePost[] = snapshot.docs.map((d) => {
          const communityId = d.ref.parent.parent?.id ?? "";
          const data = d.data() as any;

          return {
            id: d.id,
            title: data.title,
            body: data.body,
            imageUrl: data.imageUrl,
            createdAt: data.createdAt ?? null,
            isPinned: data.isPinned ?? false,
            timeline: data.timeline ?? false,
            likesCount: data.likesCount ?? 0,
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

  // ② 各投稿の like 状態を購読（uidがいる時だけ）
  useEffect(() => {
    if (!uid) {
      setLikedMap({});
      return;
    }

    const unsubs: Array<() => void> = [];

    posts.forEach((p) => {
      if (!p.communityId) return;

      const likeRef = doc(db, "communities", p.communityId, "posts", p.id, "likes", uid);

      const unsub = onSnapshot(likeRef, (snap) => {
        const key = `${p.communityId}_${p.id}`;
        setLikedMap((prev) => ({ ...prev, [key]: snap.exists() }));
      });

      unsubs.push(unsub);
    });

    return () => unsubs.forEach((u) => u());
  }, [posts, uid]);

  // ③ 表示に必要なコミュニティ名をまとめて引く（キャッシュ）
  useEffect(() => {
    const uniqueCommunityIds = Array.from(new Set(posts.map((p) => p.communityId).filter(Boolean)));

    const fetchNeeded = async () => {
      const toFetch = uniqueCommunityIds.filter(
        (cid) => !communityNameMap[cid] && !fetchingSetRef.current.has(cid)
      );
      if (toFetch.length === 0) return;

      toFetch.forEach((cid) => fetchingSetRef.current.add(cid));

      try {
        const results = await Promise.all(
          toFetch.map(async (cid) => {
            const snap = await getDoc(fsDoc(db, "communities", cid));
            const name = snap.exists()
              ? (snap.data() as any).name ?? "（無名コミュニティ）"
              : "（削除済み）";
            return [cid, name] as const;
          })
        );

        setCommunityNameMap((prev) => {
          const next = { ...prev };
          results.forEach(([cid, name]) => (next[cid] = name));
          return next;
        });
      } finally {
        toFetch.forEach((cid) => fetchingSetRef.current.delete(cid));
      }
    };

    fetchNeeded();
  }, [posts, communityNameMap]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!uid) {
        setFavoriteCommunitySet(new Set());
        setFavOnly(false); // ログアウトしたらOFFに戻す（好みで）
        return;
      }

      setFavoriteLoading(true);
      try {
        const favRef = collection(db, "users", uid, "favorites");
        const snap = await getDocs(favRef);

        const ids = snap.docs
          .map((d) => (d.data() as any).communityId as string)
          .filter(Boolean);

        setFavoriteCommunitySet(new Set(ids));
      } finally {
        setFavoriteLoading(false);
      }
    };

    fetchFavorites();
  }, [uid]);


  // ★ 並び替え（表示用は sortedPosts を使う）
  const sortedPosts = useMemo(() => {
    const copy = [...posts];

    if (sortType === "like") {
      return copy.sort((a, b) => (b.likesCount ?? 0) - (a.likesCount ?? 0));
    }

    return copy.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
  }, [posts, sortType]);

  const visiblePosts = useMemo(() => {
    if (!favOnly) return sortedPosts;
    return sortedPosts.filter((p) => favoriteCommunitySet.has(p.communityId));
  }, [sortedPosts, favOnly, favoriteCommunitySet]);

  const hasPosts = visiblePosts.length > 0;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1 style={{ margin: 0 }}>タイムライン</h1>
        <Link to="/" style={{ textDecoration: "underline" }}>
          ← 一覧へ戻る
        </Link>
      </div>

      {/* ソート切り替え */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => setSortType("new")} className={sortType === "new" ? "active-sort" : ""}>
          新着順
        </button>
        <button onClick={() => setSortType("like")} className={sortType === "like" ? "active-sort" : ""}>
          ❤️ いいね順
        </button>

        <button
          onClick={() => setFavOnly((v) => !v)}
          className={favOnly ? "active-sort" : ""}
          disabled={!uid || favoriteLoading}
          title={!uid ? "ログインすると使えます" : ""}
        >
          ★お気に入りの投稿だけ
        </button>
      </div>

      {loading ? (
        <p style={{ marginTop: 16 }}>読み込み中...</p>
      ) : !hasPosts ? (
        <p style={{ marginTop: 16 }}>まだ投稿がありません。</p>
      ) : (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {visiblePosts.map((p) => {
            const communityName = p.communityId
              ? communityNameMap[p.communityId] ?? "（読み込み中…）"
              : "（不明）";

            const likeKey = `${p.communityId}_${p.id}`;
            const liked = likedMap[likeKey] ?? false;
            const postHref = `/communities/${p.communityId}?tab=blog&post=${p.id}`;

            return (
              <Link
                key={likeKey}
                to={postHref}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <article
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 14,
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                  <div className="meta-row">
                    <Link
                      to={`/communities/${p.communityId}`}
                      className="community-pill"
                      title={communityName}
                    >
                      {communityName}
                    </Link>

                    {p.createdAt ? <span className="meta-sep">・</span> : null}
                    {p.createdAt ? <span className="meta-date">{formatDate(p.createdAt)}</span> : null}
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

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!uid) return;
                    toggleLike({ communityId: p.communityId, postId: p.id, uid });
                  }}
                  disabled={!uid}
                  className={`like-button ${liked ? "liked" : ""}`}
                >
                  {liked ? "❤️" : "🤍"} {p.likesCount ?? 0}
                </button>
              </article>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
