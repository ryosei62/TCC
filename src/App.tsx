import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TestLogin from "./pages/testLogin"; // Changed from testLogin to TestLogin
import CommunityList from "./pages/CommunityList";
import CommunityDetail from "./pages/CommunityDetail";
import CommunitiesList from "./pages/CommunitiesList";
import CommunitiesDetail from "./pages/CommunitiesDetail";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TestLogin />} />
        <Route path="/CommunityList" element={<CommunityList />} />
        <Route path="/community/:id" element={<CommunityDetail />} />
        <Route path="/communitiesList" element={<CommunitiesList />} />
        <Route path="/communities/:id" element={<CommunitiesDetail />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
