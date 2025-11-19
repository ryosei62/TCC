import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CommunityList from "./pages/CommunityList";
import CommunitiesDetail from "./pages/CommunitiesDetail";
import { CreateCommunity } from "./pages/CreateCommunity";
import { About } from "./pages/About";
import { SignupForm } from "./pages/SignupForm";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { CreateBlog } from "./pages/CreateBlog";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CommunityList />} />
        <Route path="/communities/:id" element={<CommunitiesDetail />} />
        <Route path="/CreateCommunity" element={<CreateCommunity />} />
        <Route path="/about" element={<About />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/communities/:id/create-blog" element={<CreateBlog communityId={""} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
