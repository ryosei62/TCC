import { useState } from "react";
import { Link } from "react-router-dom"; 
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
      // メッセージを少し詳細に（mainブランチの文言を採用）
      setMessage("登録しました。\n大学メール（Microsoft 365）に届く確認メールをチェックしてください。");
      
      // フォームをクリアしてスッキリさせる（signup_cssの機能）
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
    // ▼ デザイン（signup_css）のクラス構造を使用
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
            placeholder="大学メールアドレス（@u.tsukuba.ac.jp）"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="signup-input"
          />
          <input
            type="password"
            placeholder="パスワード(半角6~10文字)"
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

        {/* ▼ ログインへのリンク（signup_cssの機能） */}
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