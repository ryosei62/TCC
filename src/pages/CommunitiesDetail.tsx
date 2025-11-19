// CommunityDetail.tsx
// DBからデータを取得してる方！

import {
  doc,
  getDoc,
  collection,
  orderBy,
  query,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CreateBlog } from "./CreateBlog";

type Community = {
  name: string;
  message: string;
  memberCount: number;
  activityDescription: string;
  activityTime: string;
  activityLocation: string;
  contact: string;
  url: string;
  thumbnailUrl?: string;
  imageUrls?: string[];
};

type Post = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  imageUrl: string;
};

type TabType = "info" | "blog";

export default function CommunityDetail() {
  const { id } = useParams<{ id: string }>();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showBlogForm, setShowBlogForm] = useState(false);

  // ------- Firestore リアルタイム取得 -------
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        // コミュニティ本体
        const docRef = doc(db, "communities", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCommunity(docSnap.data() as Community);
        }

        // ブログ一覧（リアルタイム）
        const postsRef = collection(db, "communities", id, "posts");
        const q = query(postsRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const postsData: Post[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Post, "id">),
          }));
          setPosts(postsData);
        });

        return () => unsubscribe();
      } catch (e) {
        console.error("エラー:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <p>読み込み中...</p>;
  if (!community) return <p>コミュニティが見つかりません。</p>;

  const displayImages = community.imageUrls || [];
  const mainImage =
    selectedImage || community.thumbnailUrl || displayImages[0];

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <Link to="/">← 一覧へ戻る</Link>
      <h1>{community.name}</h1>

      {/* ---------- メイン画像とサムネイル ---------- */}
      {displayImages.length > 0 && (
        <div style={{ marginTop: "12px", marginBottom: "24px" }}>
          <div style={{ width: "100%", maxWidth: "500px", marginBottom: "10px" }}>
            <img
              src={mainImage}
              alt={community.name}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "400px",
                objectFit: "contain",
                borderRadius: "8px",
                border: "1px solid #eee",
              }}
            />
          </div>

          {/* サムネイル */}
          {displayImages.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                overflowX: "auto",
                paddingBottom: "5px",
              }}
            >
              {displayImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`sub-${idx}`}
                  onClick={() => setSelectedImage(img)}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    cursor: "pointer",
                    border:
                      mainImage === img
                        ? "3px solid #2563eb"
                        : "1px solid #ddd",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------- タブ ---------- */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #ddd",
          marginTop: "16px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("info")}
          style={{
            flex: 1,
            padding: "8px 0",
            border: "none",
            borderBottom:
              activeTab === "info"
                ? "2px solid #2563eb"
                : "2px solid transparent",
            background: "transparent",
            cursor: "pointer",
            fontWeight: activeTab === "info" ? 600 : 400,
          }}
        >
          コミュニティ情報
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("blog")}
          style={{
            flex: 1,
            padding: "8px 0",
            border: "none",
            borderBottom:
              activeTab === "blog"
                ? "2px solid #2563eb"
                : "2px solid transparent",
            background: "transparent",
            cursor: "pointer",
            fontWeight: activeTab === "blog" ? 600 : 400,
          }}
        >
          ブログ
        </button>
      </div>

      {/* ---------- info タブ ---------- */}
      {activeTab === "info" && (
        <div style={{ marginTop: "16px" }}>
          <p><strong>一言メッセージ:</strong> {community.message}</p>
          <p><strong>構成人数:</strong> {community.memberCount}</p>
          <p><strong>活動内容:</strong> {community.activityDescription}</p>
          <p><strong>活動時間:</strong> {community.activityTime}</p>
          <p><strong>活動場所:</strong> {community.activityLocation}</p>
          <p><strong>連絡先:</strong> {community.contact}</p>
          <p>
            <strong>URL:</strong>{" "}
            <a href={community.url} target="_blank" rel="noreferrer">
              {community.url}
            </a>
          </p>
        </div>
      )}

      {/* ---------- blog タブ ---------- */}
      {activeTab === "blog" && (
        <>
          {/* 右下の＋ボタン */}
          <button
            onClick={() => setShowBlogForm(true)}
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              fontSize: "32px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 1000,
            }}
          >
            ＋
          </button>

          {/* ブログ一覧 */}
          <div style={{ marginTop: "16px" }}>
            {posts.length === 0 ? (
              <p>まだブログ記事がありません。</p>
            ) : (
              posts.map((post) => (
                <article
                  key={post.id}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "12px",
                    background: "#fafafa",
                  }}
                >
                  <h3>{post.title}</h3>

                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      style={{
                        width: "100%",
                        borderRadius: "8px",
                        marginTop: "8px",
                      }}
                    />
                  )}

                  <p style={{ whiteSpace: "pre-wrap", marginTop: "8px" }}>
                    {post.body}
                  </p>
                </article>
              ))
            )}
          </div>

          {/* ▼ スライド表示されるブログ投稿フォーム ▼ */}
          {showBlogForm && (
            <div
              style={{
                position: "fixed",
                bottom: "0",
                left: "0",
                width: "100%",
                height: "70%",
                backgroundColor: "white",
                borderTopLeftRadius: "16px",
                borderTopRightRadius: "16px",
                boxShadow: "0 -2px 12px rgba(0,0,0,0.2)",
                overflowY: "scroll",
                padding: "16px",
                zIndex: 2000,
              }}
            >
              {/* × ボタン */}
              <button
                onClick={() => setShowBlogForm(false)}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "20px",
                  fontSize: "30px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ×
              </button>

              {/* 投稿フォーム */}
              <CreateBlog
                communityId={id!}
                onPosted={() => {
                  setShowBlogForm(false); // フォーム閉じる
                  window.scrollTo({ top: 0, behavior: "smooth" }); // 上に戻る
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
