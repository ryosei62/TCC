// CommunityDetail.tsx
import {
  doc,
  getDoc,
  collection,
  orderBy,
  query,
  onSnapshot,
  updateDoc,
  deleteDoc,
  getDocs,
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
import { useRef } from "react";
import "./CommunityDetail.css";

type Community = {
  name: string;
  message: string;
  memberCount: string;
  activityDescription: string;
  activityTime: string;
  activityLocation: string;
  contact: string;
  url: string;
  thumbnailUrl?: string;
  imageUrls?: string[];
  snsUrls?: { label: string; url: string }[];
  joinUrls?: { label: string; url: string }[];
  joinDescription?: string;  
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
  const editingPostRef = useRef<HTMLDivElement | null>(null);

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [showJoinPanel, setShowJoinPanel] = useState(false);
  const [isEditingCommunity, setIsEditingCommunity] = useState(false);
  const [communityForm, setCommunityForm] = useState<Community | null>(null);
  const [snsUrls, setSnsUrls] = useState<{ label: string; url: string }[]>([]);
  const [joinUrls, setJoinUrls] = useState<{ label: string; url: string }[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingPostForm, setEditingPostForm] = useState({
    title: "",
    body: "",
    imageUrl: "",
  });
  const formatDate = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("ja-jp", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  // ------- Firestore リアルタイム取得 -------
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        // コミュニティ本体
        const docRef = doc(db, "communities", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Community;
          setCommunity(data);
          setCommunityForm(data);
          setSnsUrls(data.snsUrls ?? [{ label: "", url: "" }]);
          setJoinUrls(data.joinUrls ?? [{ label: "", url: "" }]);
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

  // コミュニティ編集フォームの入力変更
  const handleCommunityInputChange = (
    field: keyof Community,
    value: string | number
  ) => {
    if (!communityForm) return;
    setCommunityForm({
      ...communityForm,
      [field]: value,
    });
  };

  // コミュニティ情報を保存
  const handleSaveCommunity = async () => {
    if (!id || !communityForm) return;

    try {
      const docRef = doc(db, "communities", id);

      const trimmedSns = snsUrls.filter((v) => v.label || v.url);
      const trimmedJoin = joinUrls.filter((v) => v.label || v.url);

      await updateDoc(docRef, { 
        ...communityForm,
        snsUrls: trimmedSns,
        joinUrls: trimmedJoin,
      });
      setCommunity({
        ...communityForm,
        snsUrls: trimmedSns,
        joinUrls: trimmedJoin,
      });
      setIsEditingCommunity(false);
      alert("コミュニティ情報を更新しました");

    } catch (e) {
      console.error(e);
      alert("更新に失敗しました");
    }
  };

  // コミュニティ削除（posts も削除）
  const handleDeleteCommunity = async () => {
    if (!id) return;

    const ok = window.confirm(
      "本当にこのコミュニティと紐づくブログ記事をすべて削除しますか？"
    );
    if (!ok) return;

    try {
      // posts サブコレクション削除
      const postsRef = collection(db, "communities", id, "posts");
      const snap = await getDocs(postsRef);
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));

      // コミュニティ本体削除
      await deleteDoc(doc(db, "communities", id));

      alert("削除しました");
      // 一覧へ
      window.location.href = "/";
    } catch (e) {
      console.error(e);
      alert("削除に失敗しました");
    }
  };

  // ブログ記事削除
  const handleDeletePost = async (postId: string) => {
    if (!id) return;
    const ok = window.confirm("この記事を削除しますか？");
    if (!ok) return;

    try {
      const postRef = doc(db, "communities", id, "posts", postId);
      await deleteDoc(postRef);
    } catch (e) {
      console.error(e);
      alert("削除に失敗しました");
    }
  };

  // ブログ編集フォームを開く
  const openEditPost = (post: Post) => {
    setEditingPost(post);
    setEditingPostForm({
      title: post.title,
      body: post.body,
      imageUrl: post.imageUrl || "",
    });
    setTimeout(() => {
      editingPostRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  // ブログ編集フォームの入力変更
  const handleEditPostChange = (
    field: "title" | "body" | "imageUrl",
    value: string
  ) => {
    setEditingPostForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ブログ編集を保存
  const handleSavePostEdit = async () => {
    if (!id || !editingPost) return;

    try {
      const postRef = doc(db, "communities", id, "posts", editingPost.id);
      await updateDoc(postRef, {
        title: editingPostForm.title,
        body: editingPostForm.body,
        imageUrl: editingPostForm.imageUrl,
      });
      
      setEditingPost(null);
      alert("ブログ記事を更新しました");
    } catch (e) {
      console.error(e);
      alert("ブログ記事の更新に失敗しました");
    }
  };



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

          {/* 管理者用編集セクション */}
          <div className="info-section admin-section">
            <div className="section-title-row">
              <h3 className="section-title">コミュニティ編集</h3>
            </div>

            {!isEditingCommunity ? (
              <div className="admin-buttons-row">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingCommunity(true);

                    setSnsUrls(community.snsUrls ?? [{ label: "", url: "" }]);
                    setJoinUrls(community.joinUrls ?? [{ label: "", url: "" }]);
                  }}
                  className="admin-edit-button"
                >
                  コミュニティ情報を編集
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCommunity}
                  className="admin-delete-button"
                >
                  コミュニティを削除
                </button>
              </div>
            ) : (
              communityForm && (
                <div className="admin-form">
                  {/* 1. コミュニティ名 */}
                  <label className="admin-form-field">
                    コミュニティ名
                    <input
                      type="text"
                      value={communityForm.name}
                      onChange={(e) =>
                        handleCommunityInputChange("name", e.target.value)
                      }
                    />
                  </label>

                  {/* 2. 一言メッセージ */}
                  <label className="admin-form-field">
                    一言メッセージ
                    <textarea
                      value={communityForm.message}
                      onChange={(e) =>
                        handleCommunityInputChange("message", e.target.value)
                      }
                    />
                  </label>

                  {/* 3. 活動内容 */}
                  <label className="admin-form-field">
                    活動内容
                    <textarea
                      value={communityForm.activityDescription}
                      onChange={(e) =>
                        handleCommunityInputChange(
                          "activityDescription",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  {/* 4. 活動場所 */}
                  <label className="admin-form-field">
                    活動場所
                    <input
                      type="text"
                      value={communityForm.activityLocation}
                      onChange={(e) =>
                        handleCommunityInputChange(
                          "activityLocation",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  {/* 5. 活動頻度 */}
                  <label className="admin-form-field">
                    活動頻度
                    <input
                      type="text"
                      value={communityForm.activityTime}
                      onChange={(e) =>
                        handleCommunityInputChange(
                          "activityTime",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  {/* 6. 連絡先（複数追加・削除可能） */}
                  <div className="admin-form-field">
                    <span>SNSリンク</span>
                    <div className="multi-input-column">
                      {snsUrls.map((item, index) => (
                        <div key={index} className="multi-input-row">
                          <input
                            type="text"
                            placeholder="サービス名 (例: Instagram)"
                            value={item.label}
                            onChange={(e) => {
                              const copy = [...snsUrls];
                              copy[index].label = e.target.value;
                              setSnsUrls(copy);
                            }}
                          />
                          <input
                            type="text"
                            placeholder="https://example.com"
                            value={item.url}
                            onChange={(e) => {
                              const copy = [...snsUrls];
                              copy[index].url = e.target.value;
                              setSnsUrls(copy);
                            }}
                          />
                          {snsUrls.length > 1 && (
                            <button
                              type="button"
                              className="small-remove-button"
                              onClick={() =>
                                setSnsUrls(snsUrls.filter((_, i) => i !== index))
                              }
                            >
                              −
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="small-add-button"
                        onClick={() =>
                          setSnsUrls([...snsUrls, { label: "", url: "" }])
                        }
                      >
                        ＋ SNSを追加
                      </button>
                    </div>
                  </div>

                  {/* 7. 参加先リンク */}
                  <div className="admin-form-field">
                    <span>参加先リンク</span>
                    <div className="multi-input-column">
                      {joinUrls.map((item, index) => (
                        <div key={index} className="multi-input-row">
                          <input
                            type="text"
                            placeholder="サービス名 (例: Discord)"
                            value={item.label}
                            onChange={(e) => {
                              const copy = [...joinUrls];
                              copy[index].label = e.target.value;
                              setJoinUrls(copy);
                            }}
                          />
                          <input
                            type="text"
                            placeholder="https://example.com"
                            value={item.url}
                            onChange={(e) => {
                              const copy = [...joinUrls];
                              copy[index].url = e.target.value;
                              setJoinUrls(copy);
                            }}
                          />
                          {joinUrls.length > 1 && (
                            <button
                              type="button"
                              className="small-remove-button"
                              onClick={() =>
                                setJoinUrls(joinUrls.filter((_, i) => i !== index))
                              }
                            >
                              −
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="small-add-button"
                        onClick={() =>
                          setJoinUrls([...joinUrls, { label: "", url: "" }])
                        }
                      >
                        ＋ 参加URLを追加
                      </button>
                    </div>
                  </div>

                  {/* 8. 構成人数 */}
                  <label className="admin-form-field">
                    構成人数
                    <input
                      type="text"
                      value={communityForm.memberCount ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^[0-9０-９]*$/.test(value)) {
                          handleCommunityInputChange("memberCount", value);
                        }
                      }}
                    />
                  </label>

                  <div className="admin-form-buttons">
                    <button
                      type="button"
                      onClick={handleSaveCommunity}
                      className="admin-save-button"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingCommunity(false);
                        setCommunityForm(community);
                      }}
                      className="admin-cancel-button"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )
            )}


          </div>

          {/* 参加ボタン */}
          {(community.joinDescription || community.contact || (community.joinUrls && community.joinUrls.length > 0)) && (
            <button
              onClick={() => setShowJoinPanel(true)}
              className="join-fab-button"
            >
              参加する
            </button>
          )}

          {/* 参加パネル（内容を SNS＋連絡先と同一イメージに） */}
          {showJoinPanel && (
            <div className="slide-up-panel join-panel">
              <button
                onClick={() => setShowJoinPanel(false)}
                className="panel-close-button"
              >
                ×
              </button>

              <h2 className="panel-title">参加方法</h2>

              {community.joinDescription && (
                <p className="panel-description">
                  {community.joinDescription}
                </p>
              )}

              {community.joinUrls && community.joinUrls.length > 0 && (
                <div className="panel-section">
                  <h3 className="panel-subtitle">参加先リンク</h3>
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
            </div>
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3>{post.title}</h3>
                    <span style={{ fontSize: "0.9rem", color: "#888" }}>
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="blog-image"
                    />
                  )}

                  <p className="blog-body">{post.body}
                  </p>
                  {/* ★ 追加: ブログ記事の編集・削除ボタン */}
                  <div className="blog-post-actions">
                    <button
                      type="button"
                      onClick={() => openEditPost(post)}  // ★ ここが変更
                      className="blog-edit-button"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className="blog-delete-button"
                    >
                      削除
                    </button>
                  </div>

                </article>
              ))
            )}
          </div>

          {/* ▼ スライド表示されるブログ投稿フォーム ▼ */}
          {showBlogForm && (
            <div className="blog-modal-panel">
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
          {/* ▼ ブログ編集フォーム（スライド表示） ▼ */}
          {editingPost && (
            <div className="blog-modal-panel" ref={editingPostRef}>
              {/* × ボタン */}
              <button
                onClick={() => setEditingPost(null)}
                className="panel-close-button"
              >
                ×
              </button>

              <div className="admin-form">
                {/* タイトル */}
                <label className="admin-form-field">
                  タイトル
                  <input
                    type="text"
                    value={editingPostForm.title}
                    onChange={(e) => handleEditPostChange("title", e.target.value)}
                  />
                </label>

                {/* 内容 */}
                <label className="admin-form-field">
                  内容
                  <textarea
                    value={editingPostForm.body}
                    onChange={(e) => handleEditPostChange("body", e.target.value)}
                    rows={5}
                  />
                </label>

                {/* 保存／キャンセル */}
                <div className="admin-form-buttons">
                  <button
                    type="button"
                    onClick={handleSavePostEdit}
                    className="admin-save-button"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPost(null)}
                    className="admin-cancel-button"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
}