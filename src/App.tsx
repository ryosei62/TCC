import React from "react";
import { AuthProvider } from "./context/AuthContext"; 
import { PrivateRoute ,PublicRoute} from "./component/PrivateRoute";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import CommunityList from "./pages/CommunityList";
import CommunitiesDetail from "./pages/CommunityDetail";
import { CreateCommunity } from "./pages/CreateCommunity";
import { About } from "./pages/About";
import { SignupForm } from "./pages/SignupForm";
import { CreateBlog } from "./pages/CreateBlog";
import { LoginForm } from "./pages/LoginForm";
import { MyPage } from "./pages/MyPage";
import { TimelinePage } from "./pages/TimelinePage";
import { Terms } from "./pages/Terms";
import { Privacy } from "./pages/Privacy";

const App: React.FC = () => {
  return (
    // 1. アプリ全体をAuthProviderで囲む（これでどこでもログイン情報が使える）
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ▼▼▼ 誰でも見れるページ ▼▼▼ */}

          {/* ▼▼▼ ログイン必須のページ（PrivateRouteで囲む） ▼▼▼ */}
          <Route path="/" element={
            <PrivateRoute><CommunityList /></PrivateRoute>
          } />
          <Route path="/about" element={
            <PrivateRoute><About /></PrivateRoute>
          } />
          <Route path="/communities/:id" element={
            <PrivateRoute><CommunitiesDetail /></PrivateRoute>
          } />
          <Route path="/CreateCommunity" element={
            <PrivateRoute><CreateCommunity /></PrivateRoute>
          } />
          <Route path="/communities/:id/create-blog" element={
            <PrivateRoute><CreateBlog communityId={""} /></PrivateRoute>
          } />
          <Route path="/mypage/:uid" element={
            <PrivateRoute><MyPage /></PrivateRoute>
          } />
          <Route path="/timeline" element={
            <PrivateRoute><TimelinePage /></PrivateRoute>
          } />

          {/* ▼▼▼ ログイン済みなら見る必要がないページ（PublicRouteで囲む） ▼▼▼ */}
          <Route path="/login" element={
            <PublicRoute><LoginForm /></PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute><SignupForm /></PublicRoute>
          } />
          <Route path="/terms" element={
              <PublicRoute><Terms /></PublicRoute>} />
          <Route path="/privacy" element={
              <PublicRoute><Privacy /></PublicRoute>} />
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
