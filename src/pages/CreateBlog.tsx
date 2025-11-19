// src/pages/CreateBlog.tsx

import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase/config";

type Props = {
    communityId: string; // ★ CommunityDetail から渡す ID
  };

export const CreateBlog: React.FC<Props> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!id) {
    return <p>コミュニティIDが指定されていません。</p>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const postsRef = collection(db, "communities", id, "posts");

      await addDoc(postsRef, {
        title,
        body,
        imageUrl: imageUrl || "", // 空でも一応フィールドは持たせる
        createdAt: new Date().toISOString(),
      });

      // 登録に成功したらコミュニティ詳細ページへ戻る
      navigate(`/communities/${id}`);
    } catch (err) {
      console.error("ブログ投稿作成中にエラー", err);
      setError("投稿の作成に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ marginTop: "16px" }}>ブログ記事を作成</h1>

      {error && (
        <p style={{ color: "red", marginTop: "8px" }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <label style={{ display: "block", fontWeight: 600 }}>
            タイトル
          </label>
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
          <label style={{ display: "block", fontWeight: 600 }}>
            本文
          </label>
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

        <div>
          <label style={{ display: "block", fontWeight: 600 }}>
            画像URL（任意）
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.png"
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              marginTop: "4px",
            }}
          />
          {/* 簡易プレビュー */}
          {imageUrl && (
            <div style={{ marginTop: "8px" }}>
              <p style={{ fontSize: "0.9rem", color: "#555" }}>画像プレビュー：</p>
              <img
                src={imageUrl}
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
}
