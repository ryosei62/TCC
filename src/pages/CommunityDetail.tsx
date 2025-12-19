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
import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { CreateBlog } from "./CreateBlog";
import axios from "axios";

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

  // ★参加方法の説明（追加済み前提）
  joinDescription?: string;

  // 代表者など（チーム側の実装に合わせて増減してOK）
  ownerUid?: string;
};

type Post = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  imageUrl: string;
};

type TabType = "info" | "blog";

const MEMBER_COUNT_OPTIONS = [
  "1-5",
  "6-10",
  "11-20",
  "21-30",
  "31-50",
  "51-100",
  "101+",
];

type OwnerCandidate = {
  uid: string;
  username: string;
  email: string;
};

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

  // ------- 画像編集（コミュニティ画像） -------
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newPreviewUrls, setNewPreviewUrls] = useState<string[]>([]);
  // サムネイルとして選択されている画像（既存＋新規プレビューを通しで数える）
  const [thumbnailIndex, setThumbnailIndex] = useState<number>(0);

  // Cloudinary 設定（CreateCommunity と同じ）
  const CLOUD_NAME = "dvc15z98t";
  const UPLOAD_PRESET = "community_images";

  // ------- 代表者変更（ユーザー検索）関連（既存実装に合わせて） -------
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerSearching, setOwnerSearching] = useState(false);
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [ownerCandidates, setOwnerCandidates] = useState<OwnerCandidate[]>([]);

  // ★ここはあなたの権限判定に合わせて（例：ownerUid === currentUser.uid）
  // 既にチーム側で実装されている想定
  const canEditCommunity = true;

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

          // 画像編集用 state 初期化
          const urls = data.imageUrls ?? [];
          setEditImageUrls(urls);
          const initialThumb = data.thumbnailUrl || urls[0] || "";
          const idx = initialThumb ? urls.indexOf(initialThumb) : 0;
          setThumbnailIndex(idx >= 0 ? idx : 0);
          setNewImageFiles([]);
          setNewPreviewUrls([]);
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
    const validIndex = currentIndex === -1 ? 0 : currentIndex;
    const prevIndex =
      validIndex === 0 ? displayImages.length - 1 : validIndex - 1;
    setSelectedImage(displayImages[prevIndex]);
  };

  // 次へボタン
  const handleNext = () => {
    if (displayImages.length === 0) return;
    const validIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex =
      validIndex === displayImages.length - 1 ? 0 : validIndex + 1;
    setSelectedImage(displayImages[nextIndex]);
  };

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

  // 画像追加（編集フォーム内）
  const handleAddNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    const previews = files.map((f) => URL.createObjectURL(f));
    setNewImageFiles((prev) => [...prev, ...files]);
    setNewPreviewUrls((prev) => [...prev, ...previews]);
  };

  const handleRemoveExistingImage = (index: number) => {
    setEditImageUrls((prev) => prev.filter((_, i) => i !== index));
    // サムネ選択のズレ補正（既存側）
    setThumbnailIndex((prev) => {
      if (prev === index) return 0;
      if (index < prev) return prev - 1;
      return prev;
    });
  };

  const handleRemoveNewImage = (index: number) => {
    // newPreviewUrls/newImageFiles の index は「新規側」の index
    const existingCount = editImageUrls.length;
    const combinedIndex = existingCount + index;

    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviewUrls((prev) => prev.filter((_, i) => i !== index));

    setThumbnailIndex((prev) => {
      if (prev === combinedIndex) return 0;
      if (combinedIndex < prev) return prev - 1;
      return prev;
    });
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", UPLOAD_PRESET);

    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      form
    );

    return res.data.secure_url as string;
  };

  const handleSaveCommunity = async () => {
    if (!id || !communityForm) return;

    try {
      const docRef = doc(db, "communities", id);

      const trimmedSns = snsUrls.filter((v) => v.label || v.url);
      const trimmedJoin = joinUrls.filter((v) => v.label || v.url);

      // 画像：新規追加分だけ Cloudinary にアップロードして既存URLと結合
      const uploadedNewUrls =
        newImageFiles.length > 0
          ? await Promise.all(newImageFiles.map((f) => uploadImageToCloudinary(f)))
          : [];

      const mergedImageUrls = [...editImageUrls, ...uploadedNewUrls];
      const nextThumbnailUrl =
        mergedImageUrls[thumbnailIndex] || mergedImageUrls[0] || "";

      await updateDoc(docRef, {
        ...communityForm,
        snsUrls: trimmedSns,
        joinUrls: trimmedJoin,
        imageUrls: mergedImageUrls,
        thumbnailUrl: nextThumbnailUrl,
      });

      setCommunity({
        ...communityForm,
        snsUrls: trimmedSns,
        joinUrls: trimmedJoin,
        imageUrls: mergedImageUrls,
        thumbnailUrl: nextThumbnailUrl,
      });

      // 編集状態をリセット
      setEditImageUrls(mergedImageUrls);
      setNewImageFiles([]);
      setNewPreviewUrls([]);
      setThumbnailIndex(
        nextThumbnailUrl ? Math.max(0, mergedImageUrls.indexOf(nextThumbnailUrl)) : 0
      );

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
      editingPostRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
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

  // ------- 代表者検索（仮実装：チーム側の users コレクションに合わせて要調整） -------
  const searchUsersForOwner = async (q: string) => {
    if (!q) {
      setOwnerCandidates([]);
      setOwnerError(null);
      return;
    }
    try {
      setOwnerSearching(true);
      setOwnerError(null);

      // TODO: チーム側の users 検索に合わせて実装してください
      // ここはダミー（空）にしています
      setOwnerCandidates([]);
    } catch (e) {
      console.error(e);
      setOwnerError("検索に失敗しました");
    } finally {
      setOwnerSearching(false);
    }
  };

  const handleSelectOwner = async (uid: string) => {
    if (!id || !communityForm) return;
    try {
      handleCommunityInputChange("ownerUid", uid);
      alert("代表者を選択しました（保存で確定）");
    } catch (e) {
      console.error(e);
      alert("代表者の変更に失敗しました");
    }
  };

  return (
    <div className="community-detail-container">
      <Link to="/" className="back-link">
        ← 一覧へ戻る
      </Link>
      <h1 className="detail-title">{community.name}</h1>

      {/* ---------- メイン画像とサムネイル ---------- */}
      {displayImages.length > 0 && (
        <div className="images-section">
          <div className="main-image-wrapper">
            <div className="slider-container">
              {displayImages.length > 1 && (
                <button onClick={handlePrev} className="slider-button prev">
                  <FaChevronLeft />
                </button>
              )}
              <img src={mainImage} alt={community.name} className="main-image" />
              {displayImages.length > 1 && (
                <button onClick={handleNext} className="slider-button next">
                  <FaChevronRight />
                </button>
              )}
            </div>
          </div>

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
            <div className="info-row">
              <div className="info-icon-wrapper">
                <FaUsers className="info-icon-main" />
              </div>
              <div className="info-text-wrapper">
                <span className="info-label">構成人数</span>
                <span className="info-value">{community.memberCount}名</span>
              </div>
            </div>

            <div className="info-row">
              <div className="info-icon-wrapper">
                <FaClock className="info-icon-main" />
              </div>
              <div className="info-text-wrapper">
                <span className="info-label">活動時間</span>
                <span className="info-value">{community.activityTime}</span>
              </div>
            </div>

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

          <div className="info-section">
            <div className="section-title-row">
              <FaInfoCircle className="section-icon" />
              <h3 className="section-title">活動内容</h3>
            </div>
            <p className="info-long-text">{community.activityDescription}</p>
          </div>

          {community.snsUrls && community.snsUrls.length > 0 && (
            <div className="info-section sns-section-wrapper">
              <div className="section-title-row">
                <FaGlobe className="section-icon" />
                <h3 className="section-title">SNS</h3>
              </div>
              <ul className="sns-list">
                {community.snsUrls.map((item, idx) => (
                  <li key={idx} className="sns-item">
                    {item.label && <span className="sns-badge">{item.label}</span>}
                    <a href={item.url} target="_blank" rel="noreferrer">
                      {item.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 管理者用編集セクション */}
          {canEditCommunity && (
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

                      // 画像編集の初期化
                      const urls = community.imageUrls ?? [];
                      setEditImageUrls(urls);
                      const thumb = community.thumbnailUrl || urls[0] || "";
                      const idx = thumb ? urls.indexOf(thumb) : 0;
                      setThumbnailIndex(idx >= 0 ? idx : 0);
                      setNewImageFiles([]);
                      setNewPreviewUrls([]);
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

                    <label className="admin-form-field">
                      一言メッセージ
                      <textarea
                        value={communityForm.message}
                        onChange={(e) =>
                          handleCommunityInputChange("message", e.target.value)
                        }
                      />
                    </label>

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

                    {/* ★参加方法の説明 */}
                    <label className="admin-form-field">
                      参加方法の説明
                      <textarea
                        value={communityForm.joinDescription ?? ""}
                        onChange={(e) =>
                          handleCommunityInputChange("joinDescription", e.target.value)
                        }
                      />
                    </label>

                    <label className="admin-form-field">
                      連絡先
                      <textarea
                        value={communityForm.contact ?? ""}
                        onChange={(e) =>
                          handleCommunityInputChange("contact", e.target.value)
                        }
                      />
                    </label>

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

                    <label className="admin-form-field">
                      活動頻度
                      <input
                        type="text"
                        value={communityForm.activityTime}
                        onChange={(e) =>
                          handleCommunityInputChange("activityTime", e.target.value)
                        }
                      />
                    </label>

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
                          onClick={() => setSnsUrls([...snsUrls, { label: "", url: "" }])}
                        >
                          ＋ SNSを追加
                        </button>
                      </div>
                    </div>

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
                          onClick={() => setJoinUrls([...joinUrls, { label: "", url: "" }])}
                        >
                          ＋ 参加URLを追加
                        </button>
                      </div>
                    </div>

                    {/* 画像（追加・削除・サムネ選択） */}
                    <div className="admin-form-field">
                      <span>コミュニティ画像（クリックでサムネイル選択）</span>

                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAddNewImages}
                        style={{ marginTop: 8 }}
                      />

                      {(editImageUrls.length > 0 || newPreviewUrls.length > 0) && (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                            gap: 10,
                            marginTop: 12,
                          }}
                        >
                          {[...editImageUrls, ...newPreviewUrls].map((src, idx) => {
                            const isSelected = thumbnailIndex === idx;
                            const isExisting = idx < editImageUrls.length;
                            const newIdx = idx - editImageUrls.length;

                            return (
                              <div
                                key={`${src}-${idx}`}
                                onClick={() => setThumbnailIndex(idx)}
                                style={{
                                  position: "relative",
                                  borderRadius: 10,
                                  overflow: "hidden",
                                  cursor: "pointer",
                                  border: isSelected ? "3px solid #2563eb" : "1px solid #ddd",
                                }}
                              >
                                <img
                                  src={src}
                                  alt={`community-img-${idx}`}
                                  style={{
                                    width: "100%",
                                    height: 110,
                                    objectFit: "cover",
                                    display: "block",
                                  }}
                                />

                                {isSelected && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      left: 6,
                                      bottom: 6,
                                      background: "rgba(37, 99, 235, 0.9)",
                                      color: "white",
                                      fontSize: 12,
                                      padding: "2px 6px",
                                      borderRadius: 999,
                                    }}
                                  >
                                    サムネイル
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isExisting) handleRemoveExistingImage(idx);
                                    else handleRemoveNewImage(newIdx);
                                  }}
                                  style={{
                                    position: "absolute",
                                    top: 6,
                                    right: 6,
                                    width: 24,
                                    height: 24,
                                    borderRadius: 999,
                                    border: "none",
                                    background: "rgba(0,0,0,0.6)",
                                    color: "white",
                                    cursor: "pointer",
                                    lineHeight: "24px",
                                  }}
                                  aria-label="remove image"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                        ※ 画像の追加は「保存」を押したタイミングでアップロードされます。
                      </div>
                    </div>

                    {/* 8. 構成人数 */}
                    <label className="admin-form-field">
                      構成人数
                      <select
                        value={communityForm.memberCount ?? ""}
                        onChange={(e) =>
                          handleCommunityInputChange("memberCount", e.target.value)
                        }
                        style={{
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                        }}
                      >
                        <option value="">選択してください</option>
                        {MEMBER_COUNT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="admin-form-field">
                      <span>代表者を変更（ユーザー検索）</span>

                      <input
                        type="text"
                        placeholder="username か email を入力"
                        value={ownerSearch}
                        onChange={(e) => {
                          const v = e.target.value;
                          setOwnerSearch(v);
                          searchUsersForOwner(v);
                        }}
                      />

                      {ownerSearching && (
                        <div style={{ fontSize: 12, opacity: 0.7 }}>検索中...</div>
                      )}
                      {ownerError && (
                        <div style={{ fontSize: 12, color: "red" }}>{ownerError}</div>
                      )}

                      {ownerCandidates.length > 0 && (
                        <div
                          style={{
                            border: "1px solid #eee",
                            borderRadius: 8,
                            marginTop: 8,
                          }}
                        >
                          {ownerCandidates.map((u) => (
                            <button
                              key={u.uid}
                              type="button"
                              onClick={() => handleSelectOwner(u.uid)}
                              style={{
                                display: "flex",
                                width: "100%",
                                gap: 10,
                                alignItems: "center",
                                padding: "10px 12px",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                              }}
                            >
                              <div style={{ fontWeight: 700 }}>{u.username}</div>
                              <div style={{ fontSize: 12, opacity: 0.7 }}>{u.email}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

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

                          // 画像編集の状態も元に戻す
                          const urls = community.imageUrls ?? [];
                          setEditImageUrls(urls);
                          const thumb = community.thumbnailUrl || urls[0] || "";
                          const idx = thumb ? urls.indexOf(thumb) : 0;
                          setThumbnailIndex(idx >= 0 ? idx : 0);
                          setNewImageFiles([]);
                          setNewPreviewUrls([]);
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
          )}

          {/* 参加ボタン & パネル */}
          {community.joinUrls && community.joinUrls.length > 0 && (
            <>
              <button onClick={() => setShowJoinPanel(true)} className="join-fab-button">
                参加する
              </button>

              {showJoinPanel && (
                <div className="slide-up-panel join-panel">
                  <button
                    onClick={() => setShowJoinPanel(false)}
                    className="panel-close-button"
                  >
                    ×
                  </button>

                  <h2 className="panel-title">参加先リンク</h2>

                  {community.joinDescription && (
                    <p className="panel-description">{community.joinDescription}</p>
                  )}

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
                          <span className="join-link-url">{item.url}</span>
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
          <button onClick={() => setShowBlogForm(true)} className="blog-fab-button">
            ＋
          </button>

          <div className="tab-content">
            {posts.length === 0 ? (
              <p>まだブログ記事がありません。</p>
            ) : (
              posts.map((post) => (
                <article key={post.id} className="blog-post">
                  <h3>{post.title}</h3>

                  {post.imageUrl && (
                    <img src={post.imageUrl} alt={post.title} className="blog-image" />
                  )}
                  <span style={{ fontSize: "0.8rem", color: "#888" }}>
                    {formatDate(post.createdAt)}
                  </span>

                  <p className="blog-body">{post.body}</p>

                  <div className="blog-post-actions">
                    <button
                      type="button"
                      onClick={() => openEditPost(post)}
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

          {showBlogForm && (
            <div className="slide-up-panel blog-form-panel">
              <button
                onClick={() => setShowBlogForm(false)}
                className="panel-close-button"
              >
                ×
              </button>

              <CreateBlog
                communityId={id!}
                onPosted={() => {
                  setShowBlogForm(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          )}

          {editingPost && (
            <div className="slide-up-panel blog-form-panel" ref={editingPostRef}>
              <button
                onClick={() => setEditingPost(null)}
                className="panel-close-button"
              >
                ×
              </button>

              <div className="admin-form">
                <label className="admin-form-field">
                  タイトル
                  <input
                    type="text"
                    value={editingPostForm.title}
                    onChange={(e) => handleEditPostChange("title", e.target.value)}
                  />
                </label>

                <label className="admin-form-field">
                  内容
                  <textarea
                    value={editingPostForm.body}
                    onChange={(e) => handleEditPostChange("body", e.target.value)}
                    rows={5}
                  />
                </label>

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
