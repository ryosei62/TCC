// CommunityDetail.tsx
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
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { 
  FaUsers, 
  FaClock, 
  FaMapMarkerAlt,  
  FaGlobe, 
  FaInfoCircle,
} from "react-icons/fa";
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
  snsUrls?: { label: string; url: string }[];
  joinUrls?: { label: string; url: string }[];
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
  const [showJoinPanel, setShowJoinPanel] = useState(false);

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
  const mainImage = selectedImage || community.thumbnailUrl || displayImages[0];

  const currentIndex = displayImages.indexOf(mainImage);

  // 前へボタンの処理
  const handlePrev = () => {
    if (displayImages.length === 0) return;
    // 現在が0番目なら最後の画像へ、それ以外なら一つ前へ
    const validIndex = currentIndex === -1 ? 0 : currentIndex;
    const prevIndex = validIndex === 0 ? displayImages.length - 1 : validIndex - 1;

    setSelectedImage(displayImages[prevIndex]);
  }

  // 次へボタンの実装
  const handleNext = () => {
    if (displayImages.length === 0) return;

    const validIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = validIndex === displayImages.length - 1 ? 0 : validIndex + 1;

    setSelectedImage(displayImages[nextIndex]);
  }

  return (
    <div className="community-detail-container">
      <Link to="/" className="back-link">← 一覧へ戻る</Link>
      <h1 className="detail-title">{community.name}</h1>

      {/* ---------- メイン画像とサムネイル ---------- */}
      {displayImages.length > 0 && (
        <div className="images-section">
          <div className="main-image-wrapper">
            <div className="slider-container">
              {/* 左ボタン（画像が２枚以上あるとき） */}
              {displayImages.length > 1 && (
                <button onClick={handlePrev} className="slider-button prev">
                  <FaChevronLeft />
                </button>
              )}
              <img
                src={mainImage}
                alt={community.name}
                className="main-image"
              />
              {/* 右ボタン(画像が２枚以上あるとき) */}
              {displayImages.length > 1 && (
                <button onClick={handleNext} className="slider-button next">
                  <FaChevronRight />
                </button>
              )}
            </div>
          </div>

          {/* サムネイル */}
          {displayImages.length > 1 && (
            <div className="thumbnail-list">
              {displayImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`sub-${idx}`}
                  onClick={() => setSelectedImage(img)}
                  className={`thumbnail-image ${mainImage === img ? "selected" : ""}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------- タブ ---------- */}
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

      {/* ---------- info タブ ---------- */}
      {activeTab === "info" && (
        <div className="tab-content">
          <div className="info-section basic-info-section">
            
            {/* 構成人数 */}
            <div className="info-row">
              <div className="info-icon-wrapper">
                <FaUsers className="info-icon-main" />
              </div>
              <div className="info-text-wrapper">
                <span className="info-label">構成人数</span>
                <span className="info-value">{community.memberCount}名</span>
              </div>
            </div>

            {/* 活動時間 */}
            <div className="info-row">
              <div className="info-icon-wrapper">
                <FaClock className="info-icon-main" />
              </div>
              <div className="info-text-wrapper">
                <span className="info-label">活動時間</span>
                <span className="info-value">{community.activityTime}</span>
              </div>
            </div>

            {/* 活動場所 */}
            <div className="info-row">
              <div className="info-icon-wrapper">
                <FaMapMarkerAlt className="info-icon-main" />
              </div>
              <div className="info-text-wrapper">
                <span className="info-label">活動場所</span>
                <span className="info-value">{community.activityLocation}</span>
              </div>
            </div>
          </div>

          {/* 活動内容 */}
          <div className="info-section">
            <div className="section-title-row">
              <FaInfoCircle className="section-icon" />
              <h3 className="section-title">活動内容</h3>
            </div>
            <p className="info-long-text">{community.activityDescription}</p>
          </div>
          
          {/* SNSリンク */}
          {community.snsUrls && community.snsUrls.length > 0 && (
            <div className="info-section sns-section-wrapper">
              <div className="section-title-row">
                <FaGlobe className="section-icon" />
                <h3 className="section-title">SNS</h3>
              </div>
              <ul className="sns-list">
                {community.snsUrls.map((item, idx) => (
                  <li key={idx} className="sns-item">
                    {item.label && (
                      <span className="sns-badge">{item.label}</span>
                    )}
                    <a href={item.url} target="_blank" rel="noreferrer">
                      {item.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}       

          {/* 参加ボタン & パネル */}
          {community.joinUrls && community.joinUrls.length > 0 && (
            <>
              <button
                onClick={() => setShowJoinPanel(true)}
                className="join-fab-button"
              >
                参加する
              </button>

              {/* 参加パネル */}
              {showJoinPanel && (
                <div className="slide-up-panel join-panel">
                  {/* 閉じるボタン */}
                  <button
                    onClick={() => setShowJoinPanel(false)}
                    className="panel-close-button"
                  >
                    ×
                  </button>

                  <h2 className="panel-title">参加先リンク</h2>
                  <p className="panel-description">
                    好きな参加先を選んでください。
                  </p>

                  <div className="join-links-container">
                    {community.joinUrls.map((item, idx) => (
                      <a
                        key={idx}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="join-link-card"
                      >
                        <div className="join-link-info">
                          <span className="join-link-label">
                            {item.label || "参加先リンク"}
                          </span>
                          <span className="join-link-url">
                            {item.url}
                          </span>
                        </div>
                        <span className="join-link-arrow">↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ---------- blog タブ ---------- */}
      {activeTab === "blog" && (
        <>
          {/* 右下の＋ボタン */}
          <button
            onClick={() => setShowBlogForm(true)}
            className="blog-fab-button"
          >
            ＋
          </button>

          {/* ブログ一覧 */}
          <div className="tab-content">
            {posts.length === 0 ? (
              <p>まだブログ記事がありません。</p>
            ) : (
              posts.map((post) => (
                <article key={post.id} className="blog-post">
                  <h3>{post.title}</h3>

                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="blog-image"
                    />
                  )}

                  <p className="blog-body">{post.body}</p>
                </article>
              ))
            )}
          </div>

          {/* ▼ スライド表示されるブログ投稿フォーム ▼ */}
          {showBlogForm && (
            <div className="slide-up-panel blog-form-panel">
              {/* × ボタン */}
              <button
                onClick={() => setShowBlogForm(false)}
                className="panel-close-button"
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