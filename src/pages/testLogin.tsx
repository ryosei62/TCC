import React from "react";
import { Link } from "react-router-dom";

const testLogin: React.FC = () => {
  return (
    <div className="community-list-container">
      
      <div className="header-links">
        <Link to="/CommunitiesList">
          <h2>DBデータ</h2>
        </Link>
      </div>

    </div>
  );
};

export default testLogin;