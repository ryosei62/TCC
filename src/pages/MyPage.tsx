// src/pages/MyPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, getDocs, getDoc, doc, query, where } from "firebase/firestore";
import { auth, db } from "../firebase/config";

type Community = {
  id: string;
  name: string;
  message?: string;
  thumbnailUrl?: string;
  createdAt?: any;
};

export const MyPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>("（読み込み中…）");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  // ① ログイン状態を監視
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // 未ログインならログイン画面へ
        navigate("/login");
        return;
      }
      // 最新状態を取得（emailVerified 反映漏れ対策）
      await user.reload();
      setCurrentUser(user);
    });
    return () => unsub();
  }, [navigate]);

  // ② 自分が作ったコミュニティ一覧を取得
  useEffect(() => {
    const fetchMyCommunities = async () => {
      if (!currentUser) return;

      setLoading(true);
      try {
        const q = query(
          collection(db, "communities"),
          where("createdBy", "==", currentUser.uid)
        );
        const snap = await getDocs(q);

        const list: Community[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name,
            message: data.message,
            thumbnailUrl: data.thumbnailUrl,
            createdAt: data.createdAt,
          };
        });

        setCommunities(list);
      } finally {
        setLoading(false);
      }
    };

    fetchMyCommunities();
  }, [currentUser]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
  
      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);
  
      if (snap.exists()) {
        const data = snap.data() as any;
        setUsername(data.username ?? "（ユーザー名未設定）");
      } else {
        setUsername("（ユーザー名未設定）");
      }
    };
  
    fetchProfile();
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>マイページ</h1>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 18 }}>アカウント情報</h2>
        <div style={{ marginTop: 8, lineHeight: 1.8 }}>
          <div><b>ユーザー名：</b>{username}</div>
          <div><b>メール：</b>{currentUser.email}</div>
          <div>
            <b>メール認証：</b>{currentUser.emailVerified ? "✅ 済" : "❌ 未"}
          </div>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>作成したコミュニティ</h2>

        {loading ? (
          <p>読み込み中...</p>
        ) : communities.length === 0 ? (
          <p>まだ作成したコミュニティがありません。</p>
        ) : (
          <ul style={{ marginTop: 12, paddingLeft: 16 }}>
            {communities.map((c) => (
              <li key={c.id} style={{ marginBottom: 10 }}>
                <Link to={`/communities/${c.id}`} style={{ textDecoration: "underline" }}>
                  {c.name}
                </Link>
                {c.message ? <div style={{ fontSize: 12, opacity: 0.8 }}>{c.message}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div style={{ marginTop: 24 }}>
        <Link to="/" style={{ textDecoration: "underline" }}>← 一覧へ戻る</Link>
      </div>
    </div>
  );
};
