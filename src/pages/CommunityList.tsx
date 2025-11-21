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
  thubmnailUrl?:string
  imageUrl?: string 
  tags: string[] // 型定義にタグを追加
  official:number //0=公式, 1=非公式
}

// コミュニティ要素をDBから取得
export default function CommunitiesList() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [searchTerm, setSearchTerm] = useState<string>(''); // 👈 追加
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<number | null>(null); //フィルタリングの状態を管理 (null:すべて, 0:公式, 1:非公式)
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
          thubmnailUrl: data.thumbnailUrl,
          imageUrl: data.imageUrl || "",
          tags:data.tags || [],
          official: data.official ?? 1, // ★追加: 未設定の場合はとりあえず非公式(1)扱いにする
        })
      })
      setCommunities(results)
    }

    fetchCommunities()
  }, [])

  // 検索処理：漢字・カタカナ・ひらがなの完全一致ベースで部分一致

  const filteredCommunities = communities.filter((c) => {
      // 1. ステータスチェック
      // filterStatusがnullなら常にtrue(チェック不要)。nullでなければ、c.officialと値が一致するか確認。
      const statusMatch = filterStatus === null || c.official === filterStatus;

      // 2. キーワードチェック
      let keywordMatch = true; // デフォルトはtrue（キーワード入力なしの場合）
      if (searchQuery) {
        // キーワード入力がある場合のみチェックを行う
        const normalizedQuery = searchQuery.toLowerCase();
        keywordMatch =
          c.name.toLowerCase().includes(normalizedQuery) ||
          c.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));
      }

      // 両方の条件を満たすコミュニティのみ表示 (AND条件)
      return statusMatch && keywordMatch;
    });

  // 検索実行関数

  const handleSearch = () => {

    setSearchQuery(searchTerm.trim());

  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag)
    setSearchTerm(tag)
  }

  const handleFilterClick = (status: number | null) => {
    setFilterStatus(status);
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
        <Link to="/signup" className="header-link">
          <h2>新規登録</h2>
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

      <div className="filter-buttons-area">
        <button
          type="button"
          // 現在の状態(filterStatus)に応じて 'active' クラスを付与
          className={`filter-button ${filterStatus === null ? 'active' : ''}`}
          onClick={() => handleFilterClick(null)}
        >
          すべて
        </button>
        <button
          type="button"
          // 公式用のスタイルクラスと、アクティブ状態のクラスを付与
          className={`filter-button official ${filterStatus === 0 ? 'active' : ''}`}
          onClick={() => handleFilterClick(0)}
        >
          公式
        </button>
        <button
          type="button"
          // 非公式用のスタイルクラスと、アクティブ状態のクラスを付与
          className={`filter-button unofficial ${filterStatus === 1 ? 'active' : ''}`}
          onClick={() => handleFilterClick(1)}
        >
          非公式
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
            {/* ★追加: 公式・非公式バッジ */}
            <div className={`status-badge ${c.official === 0 ? 'official' : 'unofficial'}`}>
              {c.official === 0 ? '公式' : '非公式'}
            </div>
            
            <Link to={`/communities/${c.id}`} className="community-link" >
              <img
                src={c.thubmnailUrl || c.imageUrl || "/favicon.png"}
                alt={c.name}
                className="community-thumbnail"
              />
          
              <h2>{c.name}</h2>
              <p>{c.message}</p>
              <p>メンバー数: {c.memberCount}人</p>
              <p>活動時間: {c.activityTime}</p>

            </Link>
            <div className="community-tags-container">
                {c.tags.map((tag) => (
                  <span
                    key={tag}
                    className="community-tag-pill"
                    onClick={() => handleTagClick(tag)} 
                    style={{ cursor: 'pointer' }}       
                  >
                    #{tag}
                  </span>
                ))}
              </div>
          </li>
        )))}
      </ul>
    </div>
  )
}
