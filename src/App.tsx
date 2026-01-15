import React from "react";
import { AuthProvider } from "./context/AuthContext"; 
import { PrivateRoute ,PublicRoute} from "./component/PrivateRoute";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./component/ScrollToTop"; // 追加

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
import { HowJoin } from './pages/HowJoin';
import { HowDiscovery } from './pages/HowDiscovery';
import { HowDive } from './pages/HowDive';

const App: React.FC = () => {
  return (
    // 1. アプリ全体をAuthProviderで囲む（これでどこでもログイン情報が使える）
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* ▼▼▼ 誰でも見れるページ ▼▼▼ */}
          <Route path="/about" element={
            <About />} />
          <Route path="/terms" element={
              <Terms />} />
          <Route path="/privacy" element={
              <Privacy />} />
          
          <Route path="/how-join" element={
            <HowJoin />} />
          <Route path="/how-discovery" element={
            <HowDiscovery />} />
          <Route path="/how-dive" element={
            <HowDive />} />

          {/* ▼▼▼ ログイン必須のページ（PrivateRouteで囲む） ▼▼▼ */}
          <Route path="/" element={
            <PrivateRoute><CommunityList /></PrivateRoute>
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
          
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
