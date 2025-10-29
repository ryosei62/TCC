// CommunityList.tsx
//　DBからデータを取得してる方！
import { collection, getDocs } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { db } from '../firebase/config'
import { useEffect, useState } from 'react'
import "./CommunityList.css"

type Community = {
  id: string
  name: string
  message: string
  memberCount: number
  imageUrl?: string // 画像URL
}

export default function CommunitiesList() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchCommunities = async () => {
      const querySnapshot = await getDocs(collection(db, 'communities'))
      const results: Community[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        results.push({
          id: doc.id,
          name: data.name,
          message: data.message,
          memberCount: data.memberCount,
          imageUrl: data.imageUrl || "",
        })
      })
      setCommunities(results)
    }

    fetchCommunities()
  }, [])

  // 検索処理：漢字・カタカナ・ひらがなの完全一致ベースで部分一致
  const filteredCommunities = communities.filter((c) => {
    if (!searchQuery) return true; // 検索クエリが空の場合は全て表示
    const regex = new RegExp(searchQuery, "g"); 
    return regex.test(c.name);
  });

  // 検索実行関数
  const handleSearch = () => {
    setSearchQuery(searchTerm.trim());
  };

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
        <Link to="/CreateCommunity" className="header-link">
          <h2>コミュニティを作る</h2>
        </Link>
        <Link to="/about" className="header-link">
          <h2>TCCについて</h2>
        </Link>
      </div>

      {/* 🔍 検索欄 */}
      <div className="search-area">
        <input
          type="text"
          placeholder="キーワードで探す"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <button
          type="button"
          className="search-button"
          onClick={handleSearch}
        >
          検索
        </button>
      </div>

      <ul className="community-ul">
        {filteredCommunities.length === 0 ? (
          <p>該当するコミュニティはありません。</p>
        ) : (
          filteredCommunities.map((c) => (
            <li key={c.id} className="community-list-item">
              <Link to={`/communities/${c.id}`} className="community-link">
                <h2>{c.name}</h2>

                {c.imageUrl && (
                  <img
                    src={c.imageUrl}
                    alt={c.name}
                    className="community-thumbnail"
                    style={{
                      width: "120px",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      marginBottom: "8px",
                    }}
                  />
                )}

                <p>{c.message}</p>
                <p>メンバー数: {c.memberCount}人</p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
