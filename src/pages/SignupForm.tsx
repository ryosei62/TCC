// SignupForm.tsx
import { useEffect, useState } from "react";
import { signUpWithUniversityEmail, resendVerificationForCurrentUser } from "../firebase/auth";

export const SignupForm = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ★ 再送用
  const [canResendAt, setCanResendAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!canResendAt) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [canResendAt]);

  const secondsLeft =
    canResendAt ? Math.max(0, Math.ceil((canResendAt - now) / 1000)) : 0;
  const canResend = canResendAt ? Date.now() >= canResendAt : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      await signUpWithUniversityEmail(username, email, password);
      setMessage("登録しました。大学メール（Microsoft 365）に届く確認メールをチェックしてください。");
      setCanResendAt(Date.now() + 60_000); // ★ 60秒クールダウン開始
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
      setMessage("確認メールを再送しました。受信トレイ以外（迷惑メール/その他）も確認してください。");
      setCanResendAt(Date.now() + 60_000); // ★ 再度クールダウン
    } catch (e: any) {
      setError(e.message ?? "再送に失敗しました");
    }
  };

  return (
    <div>
      <h2>新規登録</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="ユーザー名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="大学メールアドレス"
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
          {loading ? "登録中..." : "登録"}
        </button>

        {/* ★ 登録後に再送UIを表示 */}
        {canResendAt && (
          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={handleResend} disabled={!canResend}>
              {canResend ? "確認メールを再送" : `再送まで ${secondsLeft}s`}
            </button>

            <p style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
              Microsoft 365 は数分遅れることがあります。「迷惑メール」「その他」も確認してください。
              検索：TCC / verify / Firebase
            </p>
          </div>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}
        {message && <p style={{ color: "green" }}>{message}</p>}
      </form>
    </div>
  );
};
