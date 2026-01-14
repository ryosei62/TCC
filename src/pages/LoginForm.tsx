// src/components/LoginForm.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithUniversityEmail } from "../firebase/auth";

// ▼ 普通のCSSファイルを読み込みます
import "./LoginForm.css";

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
      navigate("/");
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ▼ 文字列でクラス名を指定します
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">ログイン</h2>
        
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="大学メールアドレス（@u.tsukuba.ac.jp）"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />

          <button type="submit" disabled={loading} className="login-button">
            {loading ? "ログイン中..." : "ログイン"}
          </button>

          {error && <p className="login-error">{error}</p>}
        </form>

        <div className="login-link-container">
          アカウントをお持ちでない方は<br />
          <Link to="/signup" className="login-link">
            新規登録はこちら
          </Link>
        </div>
      </div>
    </div>
  );
};