// CommunityList.tsx
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
}

// コミュニティ要素をDBから取得
export default function CommunitiesList() {
  const [communities, setCommunities] = useState<Community[]>([])

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
        })
      })
      setCommunities(results)
    }

    fetchCommunities()
  }, [])

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
        />
        <button type="button" className="search-button">
          検索
        </button>
      </div>

      <ul className="community-ul">
        {communities.map((c) => (
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
          </li>
        ))}
      </ul>
    </div>
  )
}
