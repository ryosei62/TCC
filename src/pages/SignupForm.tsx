// src/components/SignupForm.tsx
import { useState } from "react";
import { Link } from "react-router-dom"; // Linkを追加
import { signUpWithUniversityEmail } from "../firebase/auth";

// ▼ CSSファイルを読み込み
import "./SignupForm.css";

export const SignupForm = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      await signUpWithUniversityEmail(username, email, password);
      // 成功しても遷移せず、メッセージを見せる
      setMessage("登録しました。\n大学メールに届いた確認メールをチェックしてください。");
      // フォームをクリアして再送信を防ぐ
      setUsername("");
      setEmail("");
      setPassword("");
    } catch (e: any) {
      setError(e.message ?? "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2 className="signup-title">新規登録</h2>
        
        <form onSubmit={handleSubmit} className="signup-form">
          <input
            type="text"
            placeholder="ユーザー名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="signup-input"
          />
          <input
            type="email"
            placeholder="大学メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="signup-input"
          />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="signup-input"
          />
          
          <button type="submit" disabled={loading} className="signup-button">
            {loading ? "登録中..." : "登録"}
          </button>

          {error && <p className="signup-error">{error}</p>}
          {message && <p className="signup-success">{message}</p>}
        </form>

        {/* ▼▼▼ ログイン画面へのリンクを追加 ▼▼▼ */}
        <div className="signup-link-container">
          すでにアカウントをお持ちの方は<br />
          <Link to="/login" className="signup-link">
            ログインはこちら
          </Link>
        </div>
      </div>
    </div>
  );
};