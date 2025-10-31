// CommunitiesList.tsx
import { collection, getDocs } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { db } from '../firebase/config'
import { useEffect, useState } from 'react'
import "./CommunityList.css"

type Community = {
  /** コミュニティID (FirestoreのドキュメントID) */
  id: string
  /** コミュニティ名 */
  name: string
  /** コミュニティの紹介文または説明 */
  message: string
  /** メンバーの数 */
  memberCount: number
  /** コミュニティの主な活動時間や頻度 */
  activityTime: string
  /** 画像のURL (省略可能) */
  imageUrl?: string 
  tags: string[] // 型定義にタグを追加
}

// コミュニティ要素をDBから取得
export default function CommunitiesList() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [searchTerm, setSearchTerm] = useState<string>(''); // 👈 追加
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
          activityTime: data.activityTime,
          imageUrl: data.imageUrl || "",
          tags:data.tags || [],
        })
      })
      setCommunities(results)
    }

    fetchCommunities()
  }, [])

  // 検索処理：漢字・カタカナ・ひらがなの完全一致ベースで部分一致

  const filteredCommunities = communities.filter((c) => {

    if (!searchQuery) return true; // 検索クエリが空の場合は全て表示

    const normalizedQuery = searchQuery.toLowerCase()
    const nameMatch = c.name.toLowerCase().includes(normalizedQuery)
    const tagMatch = c.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))

    return nameMatch || tagMatch

  });

  // 検索実行関数

  const handleSearch = () => {

    setSearchQuery(searchTerm.trim());

  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag)
    setSearchTerm(tag)
  }

// コミュニティ一覧表示
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

      <div className="search-area">
        <input 
          type="text"
          placeholder="キーワードで探す"
          className="search-input"
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          onKeyDown={(e) => { 
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <button type="button"
          className="search-button"
          onClick={handleSearch}>
          検索
        </button>
      </div>

      <ul className="community-ul">
        {filteredCommunities.length === 0 ? (
          <p>該当するコミュニティはありません。</p>
        ) : (
          filteredCommunities.map((c) => (
          <li 
            key={c.id}
            className="community-list-item"
          >
            <Link to={`/communities/${c.id}`} className="community-link" >
              {c.imageUrl && (
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  className="community-thumbnail"
                />
              )}
              <h2>{c.name}</h2>
              <p>{c.message}</p>
              <p>メンバー数: {c.memberCount}人</p>
              <p>活動時間: {c.activityTime}</p>

              
              

            </Link>
            {/* 👇 3. ここからタグ表示を追加 */}
            <div className="community-tags-container">
                {c.tags.map((tag) => (
                  <span
                    key={tag}
                    className="community-tag-pill"
                    onClick={() => handleTagClick(tag)} // ←追加
                    style={{ cursor: 'pointer' }}       // ←見た目上クリックできるように
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              {/* 👆 ここまでタグ表示を追加 */}
          </li>
        )))}
      </ul>
    </div>
  )
}
