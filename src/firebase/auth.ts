// src/firebase/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  User,
} from "firebase/auth";
import { auth, db } from "./config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// 大学ドメイン
const ALLOWED_DOMAIN = "@u.tsukuba.ac.jp";

// ★ 認証後に飛ばすURL（本番に固定）
const VERIFY_CONTINUE_URL =
  "https://vite-react-green-seven-vmevmu4imf.vercel.app";

const isAllowedUniversityEmail = (email: string) => {
  return email.endsWith(ALLOWED_DOMAIN);
};

// サインアップ（新規登録）
export const signUpWithUniversityEmail = async (
  username: string,
  email: string,
  password: string
): Promise<User> => {
  if (!isAllowedUniversityEmail(email)) {
    throw new Error(`このサービスは ${ALLOWED_DOMAIN} のメールアドレスのみ登録できます。`);
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    username: username.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // ★ ここで確認メール送信（URLは本番に固定）
  if (!user.emailVerified) {
    await sendEmailVerification(user, {
      url: VERIFY_CONTINUE_URL,
      handleCodeInApp: true,
    });
  }

  return user;
};

// ログイン
export const signInWithUniversityEmail = async (
  email: string,
  password: string
): Promise<User> => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  if (!isAllowedUniversityEmail(user.email || "")) {
    await signOut(auth);
    throw new Error(`このサービスは ${ALLOWED_DOMAIN} のメールアドレスのみ利用できます。`);
  }

  await user.reload();

  if (!user.emailVerified) {
    await signOut(auth);
    throw new Error(
      "メールアドレスの確認が完了していません。大学メールに届いた確認メールのリンクをクリックしてから、再度ログインしてください。"
    );
  }

  return user;
};

// 確認メールの再送
export const resendVerificationForCurrentUser = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("再送するにはログイン状態が必要です。");

  await user.reload();
  if (user.emailVerified) {
    throw new Error("すでにメール確認が完了しています。ログインしてください。");
  }

  await sendEmailVerification(user, {
    url: VERIFY_CONTINUE_URL,
    handleCodeInApp: true,
  });
};
