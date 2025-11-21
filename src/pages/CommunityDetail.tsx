// CommunityDetail.tsx
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

import "./CommunityDetail.css";

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

  if (loading) return <p className="loading-text">読み込み中...</p>;
  if (!community) return <p className="error-text">コミュニティが見つかりません。</p>;

  const displayImages = community.imageUrls || [];
  // メイン画像決定ロジック
  const mainImage = selectedImage || community.thumbnailUrl || displayImages[0];

  return (
    <div className="community-detail-container">
      <Link to="/" className="back-link">← 一覧へ戻る</Link>
      <h1 className="detail-title">{community.name}</h1>

      {displayImages.length > 0 && (
        <div className="images-section">
          {/* メイン画像表示 */}
          <div className="main-image-wrapper">
            <img
              src={mainImage}
              alt={community.name}
              className="main-image"
            />
          </div>

          {/* サムネイルリスト（画像が2枚以上ある場合のみ表示） */}
          {displayImages.length > 1 && (
            <div className="thumbnail-list">
              {displayImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`sub-${idx}`}
                  onClick={() => setSelectedImage(img)}
                  // 条件付きクラス付与: 選択中の画像に 'selected' クラスをつける
                  className={`thumbnail-image ${mainImage === img ? "selected" : ""}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* タブヘッダー */}
      <div className="tab-header">
        <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={`tab-button ${activeTab === "info" ? "active" : ""}`}
        >
          コミュニティ情報
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("blog")}
          className={`tab-button ${activeTab === "blog" ? "active" : ""}`}
        >
          ブログ
        </button>
      </div>

      {/* コミュニティ情報タブ */}
      {activeTab === "info" && (
        <div className="tab-content info-content">
          <div className="info-item">
            <strong>一言メッセージ:</strong> {community.message}
          </div>
          <div className="info-item">
            <strong>構成人数:</strong> {community.memberCount}名
          </div>
          <div className="info-item">
            <strong>活動内容:</strong> {community.activityDescription}
          </div>
          <div className="info-item">
            <strong>活動時間:</strong> {community.activityTime}
          </div>
          <div className="info-item">
            <strong>活動場所:</strong> {community.activityLocation}
          </div>
          <div className="info-item">
            <strong>連絡先:</strong> {community.contact}
          </div>
          <div className="info-item">
            <strong>URL:</strong>{" "}
            <a href={community.url} target="_blank" rel="noreferrer">
              {community.url}
            </a>
          </div>
        </div>
      )}

      {/* ブログタブ */}
      {activeTab === "blog" && (
        <div className="tab-content blog-content">
          {posts.length === 0 ? (
            <p>まだブログ記事がありません。</p>
          ) : (
            posts.map((post) => (
              <div key={post.id}>
                <article className="blog-post">
                  <h3 className="blog-title">{post.title}</h3>
                  {/* 画像があるときだけ表示 */}
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="blog-image"
                    />
                  )}

                  <p className="blog-body">
                    {post.body}
                  </p>
                </article>
              </div>
            ))
          )}
          <div className="create-blog-wrapper">
            <CreateBlog communityId={id!} />
          </div>
        </div>
      )}
    </div>
  );
}