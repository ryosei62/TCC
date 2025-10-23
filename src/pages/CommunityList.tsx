// サンプルデータの方！
import React from "react";
import { Link } from "react-router-dom";
import { communities } from "../data/communities";
import "./CommunityList.css"; 

const CommunityList: React.FC = () => {
  return (
      <div className="community-list-container">
        <div className="main-title-area">
          <img 
            src="/favicon.png" 
            alt="TCCロゴ" 
            width="40" 
            height="40" 
            className="main-logo" 
          />
          <h1>つくばカジュアルコミュニティ</h1>
      </div>
      
      <div className="header-links">
        <Link to="/search" className="header-link">
          <h2>コミュニティを作る</h2>
        </Link>
        <Link to="/about" className="header-link">
          <h2>TCCについて</h2>
        </Link>
      </div>

      <div className="search-area">
        <input 
          type="text" 
          placeholder="キーワードで探す" 
          className="search-input"
        />
        <button type="button" className="search-button">
          検索
        </button>
      </div>
      
      <ul className="community-ul"> {/* クラス名を追加 */}
        {communities.map((c) => (
          <li
            key={c.id}
            className="community-list-item" // クラス名を追加
          >
            <Link
              to={`/community/${c.id}`}
              className="community-link" // クラス名を追加
            >
              <h2>{c.name}</h2>
              <p>{c.message}</p>
              <p className="member-count">参加人数：{c.members}人</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommunityList;