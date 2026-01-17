import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  // ユーザーがいなければログインページへ転送
  if (!user) {
    return <Navigate to="/about" />;
  }

  if (user && !user.emailVerified) {
  return <Navigate to="/verify-email" />; // ← ここに飛ばす
  }

  // ログインしていれば、中身（ページ）を表示
  return <>{children}</>;
};

export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/" />; // ログイン済みならトップへ
  }
  return <>{children}</>;
};

