// src/pages/MyPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
        setProfile({
          username: data.username ?? "（ユーザー名未設定）",
          email: data.email ?? "",
          photoURL: data.photoURL,
        });
      } else {
        setProfile({
          username: "（ユーザー不明）",
          email: "",
        });
      }
    };

    fetchProfile();
  }, [targetUid]);

  // ③ 表示対象(uid)が作ったコミュニティを取得
  useEffect(() => {
    const fetchCommunities = async () => {
      if (!targetUid) return;

      setLoading(true);
      try {
        const q = query(
          collection(db, "communities"),
          where("createdBy", "==", targetUid)
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

    fetchCommunities();
  }, [targetUid]);

  if (!targetUid) return null;

  const isMyPage = currentUser?.uid === targetUid;

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>{isMyPage ? "マイページ" : "ユーザーページ"}</h1>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 18 }}>アカウント情報</h2>
        <div style={{ marginTop: 8, lineHeight: 1.8 }}>
          <div><b>ユーザー名：</b>{profile?.username ?? "（読み込み中…）"}</div>
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
                {c.message ? (
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{c.message}</div>
                ) : null}
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
