// src/components/LoginForm.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithUniversityEmail } from "../firebase/auth";

export const LoginForm = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithUniversityEmail(email, password);
      // ログイン成功時に遷移したい場所（ホームに飛ばす例）
      navigate("/");
    } catch (e: any) {
      console.error(e);
      // Firebaseのエラーコードで出し分けしたければここで条件分岐してもOK
      setError(e.message ?? "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>ログイン</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320 }}>
        <input
          type="email"
          placeholder="大学メールアドレス（@u.tsukuba.ac.jp）"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "ログイン中..." : "ログイン"}
        </button>

        {error && <p style={{ color: "red", whiteSpace: "pre-line" }}>{error}</p>}
      </form>
    </div>
  );
};
