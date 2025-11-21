// SignupForm.tsx
import { useState } from "react";
import { signUpWithUniversityEmail } from "../firebase/auth";

export const SignupForm = () => {
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
      await signUpWithUniversityEmail(email, password);
      setMessage("登録しました。大学メールに届いた確認メールをチェックしてください。");
    } catch (e: any) {
      setError(e.message ?? "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>開発中</h2>
    <form onSubmit={handleSubmit}>
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
      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}
    </form>
    </div>
  );
};
