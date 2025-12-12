// auth.ts
// src/firebase/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  User,
} from "firebase/auth";
import { auth, db } from "./config"; // ★ ここがポイント：initializeAppしない
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// 大学ドメイン
const ALLOWED_DOMAIN = "@u.tsukuba.ac.jp";

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
    // username は今は未設定でOK（後でプロフィール編集で入れられる）
    username: username.trim(),
    emailVerified: user.emailVerified, // 初回はたぶん false
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // ここで確認メール送信（URLも明示しておくのがおすすめ）
  if (cred.user && !cred.user.emailVerified) {
    await sendEmailVerification(cred.user, {
      url: `${window.location.origin}/verify-email`,
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
  const user = cred.user;

  // 大学ドメインのチェック
  if (!isAllowedUniversityEmail(user.email || "")) {
    await signOut(auth);
    throw new Error(`このサービスは ${ALLOWED_DOMAIN} のメールアドレスのみ利用できます。`);
  }

  // 最新状態を取得（メール認証直後のキャッシュ問題対策）
  await user.reload();

  // メール未確認なら弾く
  if (!user.emailVerified) {
    await signOut(auth);
    throw new Error(
      "メールアドレスの確認が完了していません。大学メールに届いた確認メールのリンクをクリックしてから、再度ログインしてください。"
    );
  }

  return user;
};
