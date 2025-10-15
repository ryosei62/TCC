import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CommunityList from "./pages/CommunityList";
import CommunityDetail from "./pages/CommunityDetail";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CommunityList />} />
        <Route path="/community/:id" element={<CommunityDetail />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
