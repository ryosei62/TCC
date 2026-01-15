// src/pages/MyPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, getDocs, getDoc, doc, query, where, documentId, orderBy, updateDoc } from "firebase/firestore";

import { auth, db } from "../firebase/config";
import "./MyPage.css"; // ★ CSS読み込み

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
  const { uid } = useParams<{ uid: string }>();
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

  useEffect(() => {
    if (!uid) {
      if (currentUser) navigate(`/mypage/${currentUser.uid}`);
      else navigate("/login");
    }
  }, [uid, currentUser, navigate]);

  const targetUid = uid || currentUser?.uid;

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
      if (!currentUser || !targetUid) return;
      if (currentUser.uid !== targetUid) {
        setFavoriteCommunities([]);
        setFavoriteLoading(false);
        return;
      }

      setFavoriteLoading(true);
      try {
        const favRef = collection(db, "users", targetUid, "favorites");
        const favSnap = await getDocs(query(favRef, orderBy("createdAt", "desc")));
        const ids = favSnap.docs
          .map((d) => (d.data() as any).communityId as string)
          .filter(Boolean);

        if (ids.length === 0) {
          setFavoriteCommunities([]);
          return;
        }

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

        const order = new Map(ids.map((id, i) => [id, i]));
        results.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

        setFavoriteCommunities(results);
      } finally {
        setFavoriteLoading(false);
      }
    };
    fetchFavorites();
  }, [currentUser, targetUid]);

  useEffect(() => {
    const fetchCommunities = async () => {
      if (!targetUid) return;
      setLoading(true);
      try {
        const communitiesRef = collection(db, "communities");
        const qOwner = query(communitiesRef, where("ownerId", "==", targetUid));
        const ownerSnap = await getDocs(qOwner);
        const qCreated = query(communitiesRef, where("createdBy", "==", targetUid));
        const createdSnap = await getDocs(qCreated);

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
    <div className="mypage-container">
      <Link to="/" className="mypage-back-link">
        ← 一覧に戻る
      </Link>

      <h1 className="mypage-title">{isMyPage ? "マイページ" : "マイページ"}</h1>

      <section className="mypage-section profile-section">
        <h2 className="section-title">アカウント情報</h2>
        
        <div className="profile-grid">
          {/* ユーザー名行 */}
          <div className="profile-row">
            <span className="profile-label">ユーザー名</span>
            <div className="profile-value-area">
              {!isMyPage || !editingName ? (
                <>
                  <span className="profile-username">
                    {profile?.username ?? "（読み込み中…）"}
                  </span>
                  {isMyPage && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingName(true);
                        setNameError(null);
                        setNameInput(profile?.username ?? "");
                      }}
                      className="edit-btn"
                    >
                      変更
                    </button>
                  )}
                </>
              ) : (
                <div className="edit-form-inline">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="ユーザーネーム"
                    className="mypage-input"
                  />
                  <div className="edit-actions">
                    <button
                      type="button"
                      onClick={saveUsername}
                      disabled={savingName}
                      className="save-btn"
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
                      className="cancel-btn"
                    >
                      キャンセル
                    </button>
                  </div>
                  {nameError && <p className="error-msg">{nameError}</p>}
                </div>
              )}
            </div>
          </div>

          {/* メールアドレス行 */}
          <div className="profile-row">
            <span className="profile-label">メールアドレス</span>
            <span className="profile-value">{profile?.email || "（非公開）"}</span>
          </div>
        </div>
      </section>

      {/* 運営コミュニティ */}
      <section className="mypage-section">
        <h2 className="section-title">運営しているコミュニティ</h2>
        {loading ? (
          <p className="loading-text">読み込み中...</p>
        ) : communities.length === 0 ? (
          <p className="empty-text">まだ運営しているコミュニティがありません。</p>
        ) : (
          <ul className="community-list">
            {communities.map((c) => (
              <li key={c.id} className="community-item">
                <Link to={`/communities/${c.id}`} className="community-card-link">
                  <div className="community-info">
                    <h3 className="community-name">{c.name}</h3>
                    {c.message && <p className="community-message">{c.message}</p>}
                  </div>
                  <span className="arrow-icon">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* お気に入り（自分のページのみ） */}
      {isMyPage && (
        <section className="mypage-section">
          <h2 className="section-title">お気に入り</h2>
          {favoriteLoading ? (
            <p className="loading-text">読み込み中...</p>
          ) : favoriteCommunities.length === 0 ? (
            <p className="empty-text">お気に入りはまだありません。</p>
          ) : (
            <ul className="community-list">
              {favoriteCommunities.map((c) => (
                <li key={c.id} className="community-item">
                  <Link to={`/communities/${c.id}`} className="community-card-link">
                    <div className="community-info">
                      <h3 className="community-name">{c.name}</h3>
                      {c.message && <p className="community-message">{c.message}</p>}
                    </div>
                    <span className="arrow-icon">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};