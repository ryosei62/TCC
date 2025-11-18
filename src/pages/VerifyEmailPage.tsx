// src/pages/VerifyEmailPage.tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { applyActionCode } from "firebase/auth";
import { auth } from "../firebase/config"; // ← ← 修正ポイントはこれ！

type Status = "loading" | "success" | "error" | "invalid";

export const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("メールアドレスを確認しています…");

  useEffect(() => {
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");

    if (mode !== "verifyEmail" || !oobCode) {
      setStatus("invalid");
      setMessage("無効なリンクです。再度お試しください。");
      return;
    }

    applyActionCode(auth, oobCode)
      .then(() => {
        setStatus("success");
        setMessage("メールアドレスの確認が完了しました！ログインしてください。");
      })
      .catch(() => {
        setStatus("error");
        setMessage("リンクが無効または期限切れです。再度メールを送信してください。");
      });
  }, [params]);

  return (
    <div style={{ padding: 32 }}>
      <h1>メールアドレス確認</h1>
      <p>{message}</p>
      {status === "success" && <a href="/login">ログインへ</a>}
    </div>
  );
}
