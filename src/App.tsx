import React from "react";
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

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CommunityList />} />
        <Route path="/communities/:id" element={<CommunitiesDetail />} />
        <Route path="/CreateCommunity" element={<CreateCommunity />} />
        <Route path="/about" element={<About />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/communities/:id/create-blog" element={<CreateBlog communityId={""} />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/mypage/:uid" element={<MyPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
