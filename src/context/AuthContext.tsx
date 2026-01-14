import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase/config"; // firebaseの初期化設定ファイルをインポート

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

// コンテキストの作成
const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// 簡単に呼び出せるようにするフック
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // 「確認中」フラグ

  useEffect(() => {
    // Firebaseのログイン状態を監視するリスナー
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // 確認が終わったらローディング終了
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {/* loading中は何も表示しない（またはローディング画面を出す）ことで「チラつき」を防ぐ */}
      {!loading && children}
    </AuthContext.Provider>
  );
};