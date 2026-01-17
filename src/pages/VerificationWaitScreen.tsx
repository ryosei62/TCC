import { useState, useEffect } from "react";
import { resendVerificationForCurrentUser } from "../firebase/auth";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";

// デザインはSignupFormと同じものを使用
import "./SignupForm.css";

export const VerificationWaitScreen = () => {
  const navigate = useNavigate();
  const [canResendAt, setCanResendAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const userEmail = auth.currentUser?.email;

  useEffect(() => {
    if (!canResendAt) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [canResendAt]);

  const secondsLeft = canResendAt ? Math.max(0, Math.ceil((canResendAt - now) / 1000)) : 0;
  const canResend = canResendAt ? Date.now() >= canResendAt : true;

  const handleResend = async () => {
    setError(null);
    setMessage(null);
    setSending(true);
    try {
      await resendVerificationForCurrentUser();
      setMessage("再送しました。");
      setCanResendAt(Date.now() + 60_000); 
    } catch (e: any) {
      setError("再送に失敗しました。");
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/signup");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card" style={{ textAlign: "center" }}>
        <h2 className="signup-title">メール確認</h2>
        
        <div style={{ marginBottom: 24, fontSize: "14px", color: "#333" }}>
          <p>確認メールを送信しました</p>
          <p style={{ fontWeight: "bold", margin: "8px 0", fontSize: "16px" }}>{userEmail}</p>
          <p style={{ fontSize: "12px", color: "#666" }}>
            メール内のリンクをクリックしてから<br/>下のボタンを押してください。
          </p>
        </div>

        {/* 1. メインボタン：リロード (SignupFormのCSSクラスを適用して大きく表示) */}
        <button 
          onClick={() => window.location.reload()} 
          className="signup-button"
          style={{ marginBottom: 20 }}
        >
          認証完了しました
        </button>

        {/* メッセージ表示エリア */}
        {(message || error) && (
          <div style={{ marginBottom: 15, fontSize: "13px" }}>
             {message && <span className="signup-success">{message}</span>}
             {error && <span className="signup-error">{error}</span>}
          </div>
        )}

        {/* 2. サブ操作エリア（リンク風のデザインに統一） */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
          
          {/* 再送リンク */}
          <div>
            メールが届かない場合は 
            <button 
              onClick={handleResend} 
              disabled={!canResend || sending}
              style={{
                background: "none",
                border: "none",
                color: (canResend && !sending) ? "#007bff" : "#ccc",
                textDecoration: "underline",
                cursor: (canResend && !sending) ? "pointer" : "default",
                padding: "0 4px",
                fontSize: "inherit"
              }}
            >
              {sending ? "送信中..." : canResend ? "再送する" : `${secondsLeft}秒後に再送可能`}
            </button>
          </div>

          {/* ログアウトリンク */}
          <div>
            <button 
              onClick={handleLogout}
              style={{ 
                background: "none", 
                border: "none", 
                color: "#007bff",
                textDecoration: "underline", 
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              メールアドレスを修正する(登録画面に戻る)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};