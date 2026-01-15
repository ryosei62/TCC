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
  limit,
  startAt,
  endAt,
  where,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState, useRef, type ChangeEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { CreateBlog } from "./CreateBlog";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { toggleLike } from "../component/LikeButton";
import { 
  FaUsers, 
  FaClock, 
  FaMapMarkerAlt,  
  FaGlobe, 
  FaInfoCircle,
  FaThumbtack,
} from "react-icons/fa";
import { addFavorite, removeFavorite, favoriteDocRef } from "../component/favorite";

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
  createdBy?: string;
  official?: number;
  ownerId?: string;
  joinDescription?: string;  
};

type Post = {
  id: string;
  title: string;
  body: string;
  createdAt: Timestamp;
  imageUrl: string;
  isPinned?: boolean;
  timeline?: boolean;
  likesCount?: number;
};

const MEMBER_COUNT_OPTIONS = [
  "1~5人",
  "6~10人",
  "11~20人",
  "21~50人",
  "51人以上"
];

const formatDate = (ts?: Timestamp) => {
  if (!ts) return "";
  const date = ts.toDate(); // ★ ここがポイント
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

type TabType = "info" | "blog";

export default function CommunityDetail() {
  const navigate = useNavigate();

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerCandidates, setOwnerCandidates] = useState<
    { uid: string; username: string; email: string; photoURL?: string }[]
  >([]);
  const [ownerSearching, setOwnerSearching] = useState(false);
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(true);
  
  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "community_images");

    const res = await fetch("https://api.cloudinary.com/v1_1/dvc15z98t/image/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data?.error?.message ?? "Cloudinary upload failed");
    if (!data?.secure_url) throw new Error("secure_url not returned");
    return data.secure_url as string;
  };

  const replaceAt = (arr: string[], idx: number, val: string) =>
    arr.map((x, i) => (i === idx ? val : x));

const handleAddCommunityImages = async (e: ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files?.length) return;
  if (!communityForm) return;

  try {
    const files = Array.from(e.target.files);
    const urls = await Promise.all(files.map(uploadToCloudinary));

    setCommunityForm((prev) => {
      if (!prev) return prev;
      const nextImageUrls = [...(prev.imageUrls ?? []), ...urls];

      // サムネが未設定なら最初の画像をサムネに
      const nextThumb = prev.thumbnailUrl || nextImageUrls[0];

      return { ...prev, imageUrls: nextImageUrls, thumbnailUrl: nextThumb };
    });

    e.target.value = ""; // 同じファイルを再選択できるように
  } catch (err: any) {
    console.error(err);
    alert(`画像追加に失敗: ${err?.message ?? "不明なエラー"}`);
  }
};
const handleReplaceCommunityImage = async (index: number, e: ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files?.[0]) return;
  if (!communityForm?.imageUrls?.length) return;

  try {
    const newUrl = await uploadToCloudinary(e.target.files[0]);

    setCommunityForm((prev) => {
      if (!prev) return prev;
      const prevUrls = prev.imageUrls ?? [];
      const oldUrl = prevUrls[index];
      const nextUrls = replaceAt(prevUrls, index, newUrl);

      // サムネが置換対象だったら新URLに追従
      const nextThumb = prev.thumbnailUrl === oldUrl ? newUrl : prev.thumbnailUrl;

      return { ...prev, imageUrls: nextUrls, thumbnailUrl: nextThumb };
    });

    e.target.value = "";
  } catch (err: any) {
    console.error(err);
    alert(`差し替えに失敗: ${err?.message ?? "不明なエラー"}`);
  }
};
const handleRemoveCommunityImage = (index: number) => {
  setCommunityForm((prev) => {
    if (!prev) return prev;
    const urls = prev.imageUrls ?? [];
    const removed = urls[index];
    const nextUrls = urls.filter((_, i) => i !== index);

    // サムネが削除されたら、残ってる先頭をサムネに（なければ空）
    let nextThumb = prev.thumbnailUrl;
    if (prev.thumbnailUrl === removed) nextThumb = nextUrls[0] ?? "";

    return { ...prev, imageUrls: nextUrls, thumbnailUrl: nextThumb };
  });
};
const handleSelectThumbnail = (url: string) => {
  setCommunityForm((prev) => (prev ? { ...prev, thumbnailUrl: url } : prev));
};


  const [favoriteLoading, setFavoriteLoading] = useState(true);  
  const [editingPostForm, setEditingPostForm] = useState({
    title: "",
    body: "",
    imageUrl: "",
    timeline: false,
  });
  const [formError, setFormError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAdmin = async () => {
      if (!currentUser) {
        setIsAdmin(false);
        return;
      }
  
      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (!snap.exists()) {
          setIsAdmin(false);
          return;
        }
        const data = snap.data() as any;
  
        // どっちの方式でも対応できるように（role or isAdmin）
        const admin = data.role === "admin" || data.isAdmin === true;
        setIsAdmin(admin);
      } catch (e) {
        console.error("admin判定の取得に失敗:", e);
        setIsAdmin(false);
      }
    };
  
    fetchAdmin();
  }, [currentUser]);

  useEffect(() => {
    if (!id || !currentUser) {
      setLikedMap({});
      return;
    }
  
    const unsubs: (() => void)[] = [];
  
    posts.forEach((p) => {
      const likeRef = doc(db, "communities", id, "posts", p.id, "likes", currentUser.uid);
      const unsub = onSnapshot(likeRef, (snap) => {
        setLikedMap((prev) => ({ ...prev, [p.id]: snap.exists() }));
      });
      unsubs.push(unsub);
    });
  
    return () => unsubs.forEach((u) => u());
  }, [id, currentUser, posts]);

  useEffect(() => {
    if (!id || !currentUser) {
      setIsFavorite(false);
      setFavoriteLoading(false);
      return;
    }

    setFavoriteLoading(true);
    const ref = favoriteDocRef(currentUser.uid, id);
    const unsub = onSnapshot(ref, (snap) => {
      setIsFavorite(snap.exists());
      setFavoriteLoading(false);
    });

    return () => unsub();
  }, [id, currentUser]);

  const location = useLocation();
  const didScrollRef = useRef(false);

  useEffect(() => {
    if (!id) return;

    const qs = new URLSearchParams(location.search);
    const tab = qs.get("tab");
    const postId = qs.get("post");

    // tab指定がないなら何もしない
    if (tab !== "blog") return;

    // blogタブへ切り替え（毎回setしてOK）
    setActiveTab("blog");

    // post指定がなければスクロールは不要
    if (!postId) return;

    // postsがまだ来てないなら待つ
    if (posts.length === 0) return;

    // 同じURLでposts更新が来ても、スクロールは1回だけ
    if (didScrollRef.current) return;

    didScrollRef.current = true;

    // 描画後にスクロール
    requestAnimationFrame(() => {
      const el = document.getElementById(`post-${postId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.search, id, posts]);

  useEffect(() => {
    didScrollRef.current = false;
  }, [location.search]);



const searchUsersForOwner = async (term: string) => {
  const t = term.trim();
  if (!t) {
    setOwnerCandidates([]);
    return;
  }

  setOwnerSearching(true);
  setOwnerError(null);

  try {
    const usersRef = collection(db, "users");

    // email検索（完全一致）
    if (t.includes("@")) {
      const q = query(usersRef, where("email", "==", t), limit(10));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          uid: d.id,
          username: data.username ?? "（未設定）",
          email: data.email ?? "",
          photoURL: data.photoURL,
        };
      });
      setOwnerCandidates(list);
      return;
    }

    // username検索（前方一致）
    // ※ orderBy が必要
    const q = query(
      usersRef,
      orderBy("username"),
      startAt(t),
      endAt(t + "\uf8ff"),
      limit(10)
    );

    const snap = await getDocs(q);
    const list = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        uid: d.id,
        username: data.username ?? "（未設定）",
        email: data.email ?? "",
        photoURL: data.photoURL,
      };
    });
    setOwnerCandidates(list);
  } catch (e: any) {
    console.error("ユーザー検索失敗:", e);
    setOwnerError("検索に失敗しました（usernameにorderByできない/インデックス不足の可能性）");
  } finally {
    setOwnerSearching(false);
  }
};

const handleSelectOwner = async (uid: string) => {
  if (!id) return;

  try {
    await updateDoc(doc(db, "communities", id), { ownerId: uid });
    setCommunity((prev) => (prev ? { ...prev, ownerId: uid } : prev));

    setOwnerSearch("");
    setOwnerCandidates([]);
    alert("代表者を変更しました");
  } catch (e) {
    console.error(e);
    alert("代表者変更に失敗しました");
  }
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
        const q = query(postsRef, orderBy("isPinned","desc"),orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const postsData: Post[] = snapshot.docs.map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              title: data.title ?? "",
              body: data.body ?? "",
              createdAt: data.createdAt,        // Timestamp想定
              imageUrl: data.imageUrl ?? "",
              isPinned: data.isPinned ?? false,
              timeline: data.timeline ?? false,
              likesCount: data.likesCount ?? 0, // ★ここ追加
            };
          });

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);
  

  if (loading) return <p>読み込み中...</p>;
  if (!community) return <p>コミュニティが見つかりません。</p>;

  const uid = currentUser?.uid;

  const canEditCommunity =
    !!uid &&
    (
      isAdmin ||
      community.createdBy === uid ||
      community.ownerId === uid
    );


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

  const handleCommunityImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    try {
      const file = e.target.files[0];

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "community_images");

      const res = await fetch("https://api.cloudinary.com/v1_1/dvc15z98t/image/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Cloudinary error:", data);
        alert(`画像アップロード失敗: ${data?.error?.message ?? "不明なエラー"}`);
        return;
      }

      if (!data?.secure_url) {
        console.error("No secure_url:", data);
        alert("画像URLが返ってきませんでした（preset設定を確認）");
        return;
      }

      // ★ 編集フォームに反映（最後に保存ボタンでFirestoreへ）
      setCommunityForm((prev) => (prev ? { ...prev, thumbnailUrl: data.secure_url } : prev));
    } catch (err) {
      console.error(err);
      alert("画像アップロード中にエラーが発生しました");
    }
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

  const isBlank = (v?: string | null) => !v || v.trim().length === 0;

  const validateCommunityForm = (c: Community | null) => {
    if (!c) return "フォームが読み込めていません。";

    if (isBlank(c.name)) return "コミュニティ名は必須です。";
    if (isBlank(c.activityDescription)) return "活動内容は必須です。";
    if (isBlank(c.activityLocation)) return "活動場所は必須です。";
    if (isBlank(c.activityTime)) return "活動頻度は必須です。";
    if (isBlank(c.joinDescription)) return "参加方法は必須です。";
    if (isBlank(c.memberCount)) return "メンバー数は必須です。";

    // 画像必須（thumbnailUrl か imageUrls のどちらか）
    const hasThumb = !!c.thumbnailUrl && c.thumbnailUrl.trim().length > 0;
    const hasImages = Array.isArray(c.imageUrls) && c.imageUrls.some((u) => !!u && u.trim().length > 0);
    if (!hasThumb && !hasImages) return "コミュニティ画像は必須です。";

    return null;
  };

  // コミュニティ情報を保存
  const handleSaveCommunity = async () => {
    if (!id || !communityForm) return;

    const err = validateCommunityForm(communityForm);
    if (err) {
      setFormError(err);
      alert(err); // 好みで消してOK（画面内表示だけでもよい）
      return;
    }

    setFormError(null);

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
      setSelectedImage(null);
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
      timeline: post.timeline ?? false, // ★追加
    });
    setTimeout(() => {
      editingPostRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };
  

  // ブログ編集フォームの入力変更
  const handleEditPostChange = (
    field: "title" | "body" | "imageUrl" | "timeline",
    value: string | boolean
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
        timeline: editingPostForm.timeline,
      });
      
      setEditingPost(null);
      alert("ブログ記事を更新しました");
    } catch (e) {
      console.error(e);
      alert("ブログ記事の更新に失敗しました");
    }
  };


  // ★追加: ピン留め切り替え関数
  const handleTogglePin = async (post: Post) => {
    if (!id) return;
    try {
      const postRef = doc(db, "communities", id, "posts", post.id);
      // isPinned の状態を反転させる (trueならfalseへ、falseならtrueへ)
      await updateDoc(postRef, {
        isPinned: !post.isPinned
      });
    } catch (e) {
      console.error("ピン留めエラー", e);
      alert("操作に失敗しました");
    }
  };

  const handleToggleFavorite = async () => {
    if (!id || !currentUser) return;

    // 体感良くするために楽観更新
    const next = !isFavorite;
    setIsFavorite(next);

    try {
      if (next) await addFavorite(currentUser.uid, id);
      else await removeFavorite(currentUser.uid, id);
    } catch (e) {
      // 失敗したら戻す
      setIsFavorite(!next);
      console.error("favorite toggle error:", e);
      alert("お気に入りの更新に失敗しました");
    }
  };

  return (
    <div className="community-detail-container">
      <button
        type="button"
        onClick={() => navigate(-1)}
      >
        ← 戻る
      </button>
      <h1 className="detail-title">{community.name}</h1>

        {/* ★ ここ追加 */}
        {currentUser && (
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={favoriteLoading}
            style={{
              marginTop: 8,
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {isFavorite ? "★ お気に入り解除" : "☆ お気に入り"}
          </button>
        )}


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
                <span className="info-value">{community.memberCount}</span>
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
                {community.contact && (
                  <li className="sns-item">
                    <span className="sns-badge">メール</span>
                    <a href={`mailto:${community.contact}`}>
                      {community.contact}
                    </a>
                  </li>
                )}
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
                  {formError && (
                    <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 10 }}>
                      {formError}
                    </div>
                  )}

                  {/* 1. コミュニティ名 */}
                  <label className="admin-form-field">
                    コミュニティ名*
                    <input
                      type="text"
                      value={communityForm.name}
                      onChange={(e) => handleCommunityInputChange("name", e.target.value)}
                      style={{
                        border: isBlank(communityForm.name) ? "1px solid #ef4444" : undefined,
                      }}
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
                    活動内容*
                    <textarea
                      value={communityForm.activityDescription}
                      onChange={(e) => handleCommunityInputChange("activityDescription", e.target.value)}
                      style={{
                        border: isBlank(communityForm.activityDescription) ? "1px solid #ef4444" : undefined,
                      }}
                    />
                  </label>

                  {/* ★ここに参加方法の説明を追加する */}
                  <label className="admin-form-field">
                    参加方法の説明*
                    <textarea
                      value={communityForm.joinDescription}
                      onChange={(e) => handleCommunityInputChange("joinDescription", e.target.value)}
                      style={{
                        border: isBlank(communityForm.joinDescription) ? "1px solid #ef4444" : undefined,
                      }}
                    />
                  </label>


                  <label className="admin-form-field">
                    連絡先
                    <textarea
                      value={communityForm.contact ?? ""}
                      onChange={(e) =>
                        handleCommunityInputChange(
                          "contact",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  {/* 4. 活動場所 */}
                  <label className="admin-form-field">
                    活動場所*
                    <textarea
                      value={communityForm.activityLocation}
                      onChange={(e) => handleCommunityInputChange("activityLocation", e.target.value)}
                      style={{
                        border: isBlank(communityForm.activityLocation) ? "1px solid #ef4444" : undefined,
                      }}
                    />
                  </label>

                  {/* 5. 活動頻度 */}
                  <label className="admin-form-field">
                    活動頻度*
                    <textarea
                      value={communityForm.activityTime}
                      onChange={(e) => handleCommunityInputChange("activityTime", e.target.value)}
                      style={{
                        border: isBlank(communityForm.activityTime) ? "1px solid #ef4444" : undefined,
                      }}
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
                    構成人数*
                    <select
                      value={communityForm.memberCount ?? ""}
                      onChange={(e) => handleCommunityInputChange("memberCount", e.target.value)}
                      style={{
                        padding: "8px",
                        borderRadius: "4px",
                        border: isBlank(communityForm.memberCount) ? "1px solid #ef4444" : "1px solid #ccc",
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

                  {/* 画像編集エリア（追加・削除・差し替え・サムネ選択） */}
                  <div className="image-upload-section">
                    <label className="image-label">
                      コミュニティ画像
                    </label>

                    {/* 追加 */}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAddCommunityImages}
                      className="input-field file-input"
                    />

                    {/* プレビュー一覧 */}
                    {(communityForm.imageUrls?.length ?? 0) > 0 && (
                      <div className="preview-area">
                        <p className="preview-note">
                          ※クリックでサムネイルを選択できます
                        </p>

                        <div className="preview-grid">
                          {(communityForm.imageUrls ?? []).map((url, index) => (
                            <div
                              key={url}
                              className={`preview-item ${communityForm.thumbnailUrl === url ? "selected" : ""}`}
                              onClick={() => handleSelectThumbnail(url)}
                            >
                              <img src={url} alt={`img-${index}`} />

                              {communityForm.thumbnailUrl === url && (
                                <span className="thumbnail-badge">サムネイル</span>
                              )}

                              <button
                                type="button"
                                className="remove-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCommunityImage(index);
                                }}
                              >
                                ×
                              </button>

                              {/* 差し替え */}
                              <label
                                style={{
                                  display: "block",
                                  marginTop: 6,
                                  fontSize: 12,
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                差し替え
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: "none" }}
                                  onChange={(e) => handleReplaceCommunityImage(index, e)}
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ★ adminだけが変更できる */}
                  {isAdmin && (
                    <label className="admin-form-field">
                      公式/非公式
                      <select
                        value={Number(communityForm.official ?? 0)}
                        onChange={(e) =>
                          handleCommunityInputChange("official", Number(e.target.value))
                        }
                        style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                      >
                        <option value={2}>公式申請中</option>
                        <option value={1}>公式</option>
                        <option value={0}>非公式</option>
                      </select>
                    </label>
                  )}


                  <div className="admin-form-field">
                    <span>代表者を変更（ユーザー検索）</span>

                    <input
                      type="text"
                      placeholder="username か email を入力"
                      value={ownerSearch}
                      onChange={(e) => {
                        const v = e.target.value;
                        setOwnerSearch(v);
                        // 入力のたびに検索（重いなら debounce にできる）
                        searchUsersForOwner(v);
                      }}
                    />

                    {ownerSearching && <div style={{ fontSize: 12, opacity: 0.7 }}>検索中...</div>}
                    {ownerError && <div style={{ fontSize: 12, color: "red" }}>{ownerError}</div>}

                    {ownerCandidates.length > 0 && (
                      <div style={{ border: "1px solid #eee", borderRadius: 8, marginTop: 8 }}>
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

          
          {/* 参加ボタン */}
          {currentUser &&
            (community.joinDescription ||
              community.contact ||
              (community.joinUrls && community.joinUrls.length > 0)) && (
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
          {canEditCommunity && (
          <button
            onClick={() => setShowBlogForm(true)}
            className="blog-fab-button"
          >
            ＋
          </button>
          )}

          {/* ブログ一覧 */}
          <div className="tab-content">
            {posts.length === 0 ? (
              <p>まだブログ記事がありません。</p>
            ) : (
              posts.map((post) => (
                <article key={post.id} id={`post-${post.id}`} className={`blog-post ${post.isPinned ? "pinned-post" : ""}`}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    {post.isPinned && (
                      <FaThumbtack style={{ color: "#2563eb", transform: "rotate(45deg)" }} />
                    )}
                    
                    <h3 style={{ margin: 0, fontSize: "1.2rem" }}>{post.title}</h3>
                    <span style={{ fontSize: "0.8rem", color: "#888" }}>
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

                  <p className="blog-body">{post.body}</p>
                  

                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser || !id) return;
                      toggleLike({ communityId: id, postId: post.id, uid: currentUser.uid });
                    }}
                    disabled={!currentUser}
                    className={`like-button ${likedMap[post.id] ? "liked" : ""}`}
                  >
                    {likedMap[post.id] ? "❤️" : "🤍"} {post.likesCount ?? 0}
                  </button>

                  {/* ★ 追加: ブログ記事の編集・削除ボタン */}
                  {canEditCommunity && (
                  <div className="blog-post-actions">
                    <button
                        type="button"
                        onClick={() => handleTogglePin(post)}
                        className={`blog-action-button ${post.isPinned ? "active-pin" : ""}`}
                        title={post.isPinned ? "固定を解除" : "トップに固定"}
                      >
                        <FaThumbtack />
                      </button>

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
                  )}

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

                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={editingPostForm.timeline}
                    onChange={(e) => handleEditPostChange("timeline", e.target.checked)}
                  />
                  タイムラインにも投稿する
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