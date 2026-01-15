// src/pages/MyPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, getDocs, getDoc, doc, query, where, documentId, orderBy, updateDoc } from "firebase/firestore";

import { auth, db } from "../firebase/config";

type Community = {
  id: string;
  name: string;
  message?: string;
  thumbnailUrl?: string;
  createdAt?: any;
};

type Profile = {
  username?: string;
  email?: string;
  photoURL?: string;
};

export const MyPage = () => {
  const navigate = useNavigate();
  const { uid } = useParams<{ uid: string }>(); // ★ URLのuid
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteCommunities, setFavoriteCommunities] = useState<Community[]>([]);
  const [favoriteLoading, setFavoriteLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // ① ログイン状態を監視（「ログイン中の自分」を知るため）
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await user.reload();
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsub();
  }, []);

  // uid が無いURLなら、自分のページに飛ばす（ログインしてる時だけ）
  useEffect(() => {
    if (!uid) {
      if (currentUser) navigate(`/mypage/${currentUser.uid}`);
      else navigate("/login");
    }
  }, [uid, currentUser, navigate]);

  const targetUid = uid || currentUser?.uid; // 表示対象

  // ② users/{uid} を取ってプロフィール表示
  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetUid) return;

      const ref = doc(db, "users", targetUid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data() as any;

        const username = data.username ?? "（ユーザー名未設定）";

        setProfile({
          username,
          email: data.email ?? "",
          photoURL: data.photoURL,
        });

        // ★ 編集中でなければ input に反映
        if (!nameInput) {
          setNameInput(username === "（ユーザー名未設定）" ? "" : username);
        }
      } else {
        setProfile({
          username: "（ユーザー不明）",
          email: "",
        });

        if (!nameInput) setNameInput("");
      }
    };

    fetchProfile();
  }, [targetUid]);


  useEffect(() => {
    const fetchFavorites = async () => {
      // 自分のページのときだけ表示（他人のお気に入りは見ない）
      if (!currentUser || !targetUid) return;
      if (currentUser.uid !== targetUid) {
        setFavoriteCommunities([]);
        setFavoriteLoading(false);
        return;
      }

      setFavoriteLoading(true);
      try {
        // 1) favorites を新しい順で取得
        const favRef = collection(db, "users", targetUid, "favorites");
        const favSnap = await getDocs(query(favRef, orderBy("createdAt", "desc")));
        const ids = favSnap.docs
          .map((d) => (d.data() as any).communityId as string)
          .filter(Boolean);

        if (ids.length === 0) {
          setFavoriteCommunities([]);
          return;
        }

        // 2) Firestore 'in' は制限があるので分割（安全に10ずつ）
        const chunk = <T,>(arr: T[], size: number) =>
          Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
            arr.slice(i * size, (i + 1) * size)
          );

        const groups = chunk(ids, 10);
        const results: Community[] = [];

        for (const g of groups) {
          const q = query(
            collection(db, "communities"),
            where(documentId(), "in", g)
          );
          const snap = await getDocs(q);
          snap.forEach((docu) => {
            const data = docu.data() as any;
            results.push({
              id: docu.id,
              name: data.name,
              message: data.message,
              thumbnailUrl: data.thumbnailUrl,
              createdAt: data.createdAt,
            });
          });
        }

        // 3) favorites の順番に並び替え
        const order = new Map(ids.map((id, i) => [id, i]));
        results.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

        setFavoriteCommunities(results);
      } finally {
        setFavoriteLoading(false);
      }
    };

    fetchFavorites();
  }, [currentUser, targetUid]);


  // ③ 表示対象(uid)が作ったコミュニティを取得
  // ③ 表示対象(uid)が「代表」のコミュニティを取得
useEffect(() => {
  const fetchCommunities = async () => {
    if (!targetUid) return;

    setLoading(true);
    try {
      const communitiesRef = collection(db, "communities");

      // 代表（ownerId）
      const qOwner = query(communitiesRef, where("ownerId", "==", targetUid));
      const ownerSnap = await getDocs(qOwner);

      // フォールバック：古いデータで ownerId が無い場合に備えて createdBy も拾う
      const qCreated = query(communitiesRef, where("createdBy", "==", targetUid));
      const createdSnap = await getDocs(qCreated);

      // 重複排除してマージ
      const map = new Map<string, Community>();

      const addToMap = (snap: any) => {
        snap.docs.forEach((d: any) => {
          const data = d.data() as any;
          map.set(d.id, {
            id: d.id,
            name: data.name,
            message: data.message,
            thumbnailUrl: data.thumbnailUrl,
            createdAt: data.createdAt,
          });
        });
      };

      addToMap(ownerSnap);
      addToMap(createdSnap);

      setCommunities(Array.from(map.values()));
    } finally {
      setLoading(false);
    }
  };

  fetchCommunities();
}, [targetUid]);

  const saveUsername = async () => {
    if (!currentUser || !targetUid) return;
    if (currentUser.uid !== targetUid) return;

    const next = nameInput.trim();
    if (next.length === 0) {
      setNameError("ユーザーネームを入力してください");
      return;
    }
    if (next.length > 20) {
      setNameError("ユーザーネームは20文字以内にしてください");
      return;
    }

    setSavingName(true);
    setNameError(null);
    try {
      const ref = doc(db, "users", targetUid);
      await updateDoc(ref, { username: next });

      // 画面上の表示も即更新（体感良く）
      setProfile((prev) => ({ ...(prev ?? {}), username: next }));
      setEditingName(false);
    } catch (e) {
      console.error(e);
      setNameError("保存に失敗しました");
    } finally {
      setSavingName(false);
    }
  };

  if (!targetUid) return null;

  const isMyPage = currentUser?.uid === targetUid;

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>{isMyPage ? "マイページ" : "ユーザーページ"}</h1>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 18 }}>アカウント情報</h2>
        <div style={{ marginTop: 8, lineHeight: 1.8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <b>ユーザー名：</b>

            {!isMyPage || !editingName ? (
              <>
                <span>{profile?.username ?? "（読み込み中…）"}</span>

                {isMyPage && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(true);
                      setNameError(null);
                      setNameInput(profile?.username ?? "");
                    }}
                    style={{ padding: "4px 10px", border: "1px solid #ddd", borderRadius: 8, background: "#fff" }}
                  >
                    変更
                  </button>
                )}
              </>
            ) : (
              <>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="ユーザーネーム"
                  style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8, minWidth: 220 }}
                />

                <button
                  type="button"
                  onClick={saveUsername}
                  disabled={savingName}
                  style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8, background: "#fff" }}
                >
                  {savingName ? "保存中..." : "保存"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingName(false);
                    setNameError(null);
                    setNameInput(profile?.username ?? "");
                  }}
                  disabled={savingName}
                  style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8, background: "#fff" }}
                >
                  キャンセル
                </button>

                {nameError ? <div style={{ width: "100%", color: "red", fontSize: 12 }}>{nameError}</div> : null}
              </>
            )}
          </div>

          <div><b>メール：</b>{profile?.email || "（非公開）"}</div>

          {/* emailVerified は Auth の情報で、他人のは取れないので「自分の時だけ」表示 */}
          {isMyPage && (
            <div>
              <b>メール認証：</b>{currentUser?.emailVerified ? "✅ 済" : "❌ 未"}
            </div>
          )}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>運営しているコミュニティ</h2>

        {loading ? (
          <p>読み込み中...</p>
        ) : communities.length === 0 ? (
          <p>まだ運営しているコミュニティがありません。</p>
        ) : (
          <ul style={{ marginTop: 12, paddingLeft: 16 }}>
            {communities.map((c) => (
              <li key={c.id} style={{ marginBottom: 10 }}>
                <Link to={`/communities/${c.id}`} style={{ textDecoration: "underline" }}>
                  {c.name}
                </Link>
                {c.message ? (
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{c.message}</div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {isMyPage && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18 }}>お気に入り</h2>

          {favoriteLoading ? (
            <p>読み込み中...</p>
          ) : favoriteCommunities.length === 0 ? (
            <p>お気に入りはまだありません。</p>
          ) : (
            <ul style={{ marginTop: 12, paddingLeft: 16 }}>
              {favoriteCommunities.map((c) => (
                <li key={c.id} style={{ marginBottom: 10 }}>
                  <Link to={`/communities/${c.id}`} style={{ textDecoration: "underline" }}>
                    {c.name}
                  </Link>
                  {c.message ? (
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{c.message}</div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}


      <div style={{ marginTop: 24 }}>
        <Link to="/" style={{ textDecoration: "underline" }}>← 一覧へ戻る</Link>
      </div>
    </div>
  );
};
