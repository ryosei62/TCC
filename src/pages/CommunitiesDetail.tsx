// CommunityDetail.tsx
// DBからデータを取得してる方！

import {
  doc,
  getDoc,
  getDocs,
  collection,
  orderBy,
  query,
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
  imageUrl: string;
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

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        // コミュニティ本体
        const docRef = doc(db, "communities", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCommunity(docSnap.data() as Community);
        } else {
          console.log("コミュニティが見つかりません");
        }

        // ブログ記事
        const postsRef = collection(db, "communities", id, "posts");
        const q = query(postsRef, orderBy("createdAt", "desc"));
        const postsSnap = await getDocs(q);

        const postsData: Post[] = postsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Post, "id">),
        }));
        setPosts(postsData);
      } catch (e) {
        console.error("コミュニティ情報取得中にエラー", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <p>読み込み中...</p>;
  if (!community) return <p>コミュニティが見つかりません。</p>;

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <Link to="/">← 一覧へ戻る</Link>
      <h1>{community.name}</h1>

      {/* 画像がある場合だけ表示 */}
      {community.imageUrl && (
        <img
          src={community.imageUrl}
          alt={community.name}
          style={{
            width: "100%",
            maxWidth: "400px",
            borderRadius: "8px",
            marginTop: "12px",
          }}
        />
      )}

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

      {activeTab === "info" && (
        <div style={{ marginTop: "16px" }}>
          <p>
            <strong>一言メッセージ:</strong> {community.message}
          </p>
          <p>
            <strong>構成人数:</strong> {community.memberCount}
          </p>
          <p>
            <strong>活動内容:</strong> {community.activityDescription}
          </p>
          <p>
            <strong>活動時間:</strong> {community.activityTime}
          </p>
          <p>
            <strong>活動場所:</strong> {community.activityLocation}
          </p>
          <p>
            <strong>連絡先:</strong> {community.contact}
          </p>
          <p>
            <strong>URL:</strong>{" "}
            <a href={community.url} target="_blank" rel="noreferrer">
              {community.url}
            </a>
          </p>
        </div>
      )}

      {activeTab === "blog" && (
        <div style={{ marginTop: "16px" }}>
          {posts.length === 0 ? (
            <p>まだブログ記事がありません。</p>
          ) : (
            posts.map((post) => (
              <div>
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
                  {/* 画像があるときだけ表示 */}
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="community-thumbnail"
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
                
              </div>
            ))
          )}
          <div style={{ height: "16px" }}>
                  <CreateBlog communityId={id!} />
          </div>
        </div>
        
      )}
    </div>
  );
}
