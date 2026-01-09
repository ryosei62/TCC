import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; 
import { signUpWithUniversityEmail, resendVerificationForCurrentUser } from "../firebase/auth";

// ▼ CSSファイルを読み込み
import "./SignupForm.css";

export const SignupForm = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ★ 再送用タイマー管理（mainブランチの機能）
  const [canResendAt, setCanResendAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!canResendAt) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [canResendAt]);

  const secondsLeft = canResendAt ? Math.max(0, Math.ceil((canResendAt - now) / 1000)) : 0;
  const canResend = canResendAt ? Date.now() >= canResendAt : false;

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

      // 再送ボタンを表示するためにタイマーセット（mainブランチの機能）
      setCanResendAt(Date.now() + 60_000); 

    } catch (e: any) {
      setError(e.message ?? "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setMessage(null);
    try {
      await resendVerificationForCurrentUser();
      setMessage("確認メールを再送しました。\n受信トレイ以外（迷惑メール/その他）も確認してください。");
      setCanResendAt(Date.now() + 60_000); // 再度クールダウン
    } catch (e: any) {
      setError(e.message ?? "再送に失敗しました");
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
            placeholder="大学メールアドレス"
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

          {/* ▼▼▼ 追加：再送UI（mainブランチの機能）をデザインの中に組み込み ▼▼▼ */}
          {canResendAt && (
            <div style={{ marginTop: 16, padding: 10, backgroundColor: "#f9f9f9", borderRadius: 8 }}>
              <p style={{ fontSize: 13, marginBottom: 8, color: "#555" }}>
                メールが届きませんか？<br/>
                Microsoft 365 は数分遅れることがあります。
              </p>
              <button 
                type="button" 
                onClick={handleResend} 
                disabled={!canResend}
                style={{
                  fontSize: 12,
                  padding: "4px 8px",
                  cursor: canResend ? "pointer" : "not-allowed",
                  backgroundColor: canResend ? "#6c757d" : "#ccc",
                  color: "white",
                  border: "none",
                  borderRadius: "4px"
                }}
              >
                {canResend ? "確認メールを再送" : `再送まで ${secondsLeft}秒`}
              </button>
            </div>
          )}
          {/* ▲▲▲ 追加ここまで ▲▲▲ */}

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