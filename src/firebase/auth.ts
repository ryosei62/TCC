// auth.ts
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  User,
} from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

auth.languageCode = 'ja';

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

  // 大学メールに確認メールを送る
  if (cred.user && !cred.user.emailVerified) {
    await sendEmailVerification(cred.user);
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
    // 念のためここでもチェック
    await signOut(auth);
    throw new Error(`このサービスは ${ALLOWED_DOMAIN} のメールアドレスのみ利用できます。`);
  }

  // メール未確認なら弾く（UI上でメッセージ出す）
  if (!cred.user.emailVerified) {
    await signOut(auth);
    throw new Error("メールアドレスの確認が完了していません。大学メールの受信箱を確認してください。");
  }

  return cred.user;
};
