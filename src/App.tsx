import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CommunitiesList from "./pages/CommunitiesList";
import CommunitiesDetail from "./pages/CommunitiesDetail";
import { CreateCommunity } from "./pages/CreateCommunity";
import { About } from "./pages/About";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CommunitiesList />} />
        <Route path="/communities/:id" element={<CommunitiesDetail />} />
        <Route path="/CreateCommunity" element={<CreateCommunity />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
