import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { VerificationWaitScreen } from "../pages/VerificationWaitScreen";

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  // ユーザーがいなければログインページへ転送
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user && !user.emailVerified) {
  return <VerificationWaitScreen />; // ← ここに飛ばす
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

