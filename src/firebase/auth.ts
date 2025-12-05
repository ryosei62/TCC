// auth.ts
// src/firebase/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "./config"; // ★ ここがポイント：initializeAppしない

// 大学ドメイン
const ALLOWED_DOMAIN = "@u.tsukuba.ac.jp";

const isAllowedUniversityEmail = (email: string) => {
  return email.endsWith(ALLOWED_DOMAIN);
};

// サインアップ（新規登録）
export const signUpWithUniversityEmail = async (
  email: string,
  password: string
): Promise<User> => {
  if (!isAllowedUniversityEmail(email)) {
    throw new Error(`このサービスは ${ALLOWED_DOMAIN} のメールアドレスのみ登録できます。`);
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // ここで確認メール送信（URLも明示しておくのがおすすめ）
  if (cred.user && !cred.user.emailVerified) {
    await sendEmailVerification(cred.user, {
      url: `${window.location.origin}/verify-email`, // ここを実際のVerifyルートに合わせる
      handleCodeInApp: true,
    });
  }

  return cred.user;
};

// ログイン
export const signInWithUniversityEmail = async (
  email: string,
  password: string
): Promise<User> => {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  if (!isAllowedUniversityEmail(cred.user.email || "")) {
    await signOut(auth);
    throw new Error(`このサービスは ${ALLOWED_DOMAIN} のメールアドレスのみ利用できます。`);
  }

  if (!cred.user.emailVerified) {
    await signOut(auth);
    throw new Error("メールアドレスの確認が完了していません。大学メールの受信箱を確認してください。");
  }

  return cred.user;
};
