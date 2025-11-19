// src/pages/CreateBlog.tsx

import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { addDoc, collection } from "firebase/firestore";
import axios from "axios";
import { db } from "../firebase/config";

type Props = {
  communityId: string; // ★ CommunityDetail から渡す ID
};

export const CreateBlog: React.FC<Props> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // Firestore に入れる URL
  const [previewUrl, setPreviewUrl] = useState(""); // プレビュー表示用
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cloudinary 設定
  const CLOUD_NAME = "dvc15z98t";
  const UPLOAD_PRESET = "community_images";

  if (!id) {
    return <p>コミュニティIDが指定されていません。</p>;
  }

  // ★ 画像選択 → Cloudinaryにアップロード
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));

    // Cloudinaryへアップロード
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        formData
      );

      setImageUrl(res.data.secure_url); // Firestore に保存する URL
    } catch (err) {
      console.error("画像アップロードエラー:", err);
      setError("画像アップロードに失敗しました。");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const postsRef = collection(db, "communities", id, "posts");

      await addDoc(postsRef, {
        title,
        body,
        imageUrl: imageUrl || "", // Cloudinary URL が入る
        createdAt: new Date().toISOString(),
      });

      navigate(`/communities/${id}`);
    } catch (err) {
      console.error("ブログ投稿作成中にエラー", err);
      setError("投稿の作成に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "sans-serif",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <Link to={`/communities/${id}`}>← コミュニティ詳細へ戻る</Link>
      <h1 style={{ marginTop: "16px" }}>ブログ記事を作成</h1>

      {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}

      <form
        onSubmit={handleSubmit}
        style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}
      >
        <div>
          <label style={{ display: "block", fontWeight: 600 }}>タイトル</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              marginTop: "4px",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600 }}>本文</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={10}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              marginTop: "4px",
              whiteSpace: "pre-wrap",
            }}
          />
        </div>

        {/* ★ Cloudinary に送る画像アップロード欄 */}
        <div>
          <label style={{ display: "block", fontWeight: 600 }}>
            画像（任意）
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              marginTop: "4px",
            }}
          />

          {/* プレビュー */}
          {previewUrl && (
            <div style={{ marginTop: "8px" }}>
              <p style={{ fontSize: "0.9rem", color: "#555" }}>画像プレビュー：</p>
              <img
                src={previewUrl}
                alt="プレビュー"
                style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px" }}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: "16px",
            padding: "10px 16px",
            borderRadius: "6px",
            border: "none",
            cursor: submitting ? "not-allowed" : "pointer",
            backgroundColor: submitting ? "#9ca3af" : "#2563eb",
            color: "#fff",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          {submitting ? "投稿中..." : "投稿する"}
        </button>
      </form>
    </div>
  );
};
