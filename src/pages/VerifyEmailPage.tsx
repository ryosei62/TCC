// src/pages/VerifyEmailPage.tsx
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { applyActionCode } from "firebase/auth";
import { auth } from "../firebase/config";

type Status = "loading" | "success" | "error" | "invalid";

export const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("メールアドレスを確認しています…");

  // 👇 StrictMode での二重実行を防ぐフラグ
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) {
      // 2回目以降の実行は無視
      return;
    }
    hasRunRef.current = true;

    const mode = params.get("mode");
    const oobCode = params.get("oobCode");

    console.log("mode:", mode);
    console.log("oobCode:", oobCode);
    console.log("current URL:", window.location.href);

    if (mode !== "verifyEmail" || !oobCode) {
      setStatus("invalid");
      setMessage("無効なリンクです。再度お試しください。");
      return;
    }

    applyActionCode(auth, oobCode)
      .then(() => {
        console.log("Email verification success");
        setStatus("success");
        setMessage("メールアドレスの確認が完了しました！ログインしてください。");
      })
      .catch((error) => {
        console.error("Email verification error:", error.code, error.message);
        setStatus("error");
        setMessage("リンクが無効または期限切れです。再度メールを送信してください。");
      });
  }, [params]);

  return (
    <div style={{ padding: 32 }}>
      <h1>メールアドレス確認</h1>
      <p>{message}</p>
      {status === "success" && (
        <a href="/login" style={{ textDecoration: "underline" }}>
          ログイン画面へ
        </a>
      )}
    </div>
  );
}
