// CommunitiesList.tsx
import { collection, getDocs, getDoc, doc, } from 'firebase/firestore'
import { Link, useNavigate } from 'react-router-dom'
import { db, auth } from '../firebase/config'
import { useEffect, useState } from 'react'
import { FaUsers, FaClock } from "react-icons/fa";
import { onAuthStateChanged, User } from "firebase/auth";
import { FaUserCircle } from "react-icons/fa";
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
  createdAt?: number
}

type SortKey = 'default' | 'createdAt' | 'memberCount'
type SortOrder = 'asc' | 'desc'

// コミュニティ要素をDBから取得
export default function CommunitiesList() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<number | null>(null); //フィルタリングの状態を管理 (null:すべて, 0:公式, 1:非公式)
  const [sortKey, setSortKey] = useState<SortKey>('default')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState<string>("（読み込み中…）");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) setIsOpen(false); // ログアウトしたら閉じる
    });
    return () => unsub();
  }, []);

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
          official: Number(data.official ?? 0), // ★追加: 未設定の場合はとりあえず非公式(1)扱いにする
          createdAt: data.createdAt
            ? (data.createdAt.toMillis ? data.createdAt.toMillis() : data.createdAt)
            : undefined,
        })
      })
      setCommunities(results)
    }

    fetchCommunities()
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
  
      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);
  
      if (snap.exists()) {
        const data = snap.data() as any;
        setUsername(data.username ?? "（ユーザー名未設定）");
      } else {
        setUsername("（ユーザー名未設定）");
      }
    };
  
    fetchProfile();
  }, [currentUser]);

  const sortedCommunities = [...communities].sort((a, b) => {
    if (sortKey === 'default') {
      // デフォルトは「元の順番」を保つためソートしない
      return 0
    }

    let aVal: number
    let bVal: number

    if (sortKey === 'createdAt') {
      aVal = a.createdAt ?? 0
      bVal = b.createdAt ?? 0
    } else {
      // memberCount
      aVal = a.memberCount ?? 0
      bVal = b.memberCount ?? 0
    }

    const diff = aVal - bVal
    return sortOrder === 'asc' ? diff : -diff
  })

  // 検索処理：漢字・カタカナ・ひらがなの完全一致ベースで部分一致

  const filteredCommunities = sortedCommunities.filter((c) => {
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

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
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
      {/* 右上アイコン（ログイン中だけ） */}
      {currentUser && (
        <>
          <button
            type="button"
            aria-label="ユーザーメニュー"
            onClick={() => setIsOpen((v) => !v)}
            className="user-menu-trigger"
          >
            <FaUserCircle />
          </button>

          {/* 背景の暗幕（開いてる時だけ） */}
          {isOpen && (
            <div
              className="user-menu-backdrop"
              onClick={() => setIsOpen(false)}
            />
          )}

          {/* 右から出るパネル */}
          <aside className={`user-menu-panel ${isOpen ? "open" : ""}`}>
            <div className="user-menu-header">
              <div className="user-menu-title">メニュー</div>
              <button
                type="button"
                className="user-menu-close"
                onClick={() => setIsOpen(false)}
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            <div className="user-menu-body">
              <div className="user-menu-user">
                <div className="user-menu-name">{ username || "名無しユーザー"}</div>
                <div className="user-menu-email">{currentUser.email}</div>
                <div className="user-menu-verified">
                  {currentUser.emailVerified ? "✅ メール認証済み" : "❌ メール未認証"}
                </div>
              </div>

              <nav className="user-menu-nav">
                {/* マイページは“置いておく”だけ。不要なら消してOK */}
                <Link to="/mypage/${auth.currentUser.uid}`}" onClick={() => setIsOpen(false)} className="user-menu-link">
                  マイページ
                </Link>
              </nav>

              <button
                type="button"
                className="user-menu-logout"
                onClick={async () => {
                  await auth.signOut();
                  setIsOpen(false);
                  navigate("/"); // 一覧に戻す
                }}
              >
                ログアウト
              </button>
            </div>
          </aside>
        </>
      )}


      <div className="header-links">
        <Link to="/CreateCommunity" className="header-link">
          <h2>コミュニティを作る</h2>
        </Link>
        <Link to="/about" className="header-link">
          <h2>TCCについて</h2>
        </Link>
        <Link to="/signup" className="signUp header-link">
          <h2>新規登録</h2>
        </Link>
        {!currentUser &&
          <Link to="/login" className="login header-link">
            <h2>ログイン</h2>
          </Link>
        }
      </div>

      <div className="controls-container">
        
        {/* 1. 検索エリア（上段） */}
        <div className="search-area">
          <input 
            type="text"
            placeholder="キーワードで探す"
            className="search-input"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          />
          <button type="button" className="search-button" onClick={handleSearch}>
            検索
          </button>
        </div>

        {/* 2. フィルタとソートを横並びにするエリア（下段） */}
        <div className="filters-sort-row">
          
          {/* 左側: フィルタボタン */}
          <div className="filter-buttons-group">
            <button
              type="button"
              className={`filter-tab ${filterStatus === null ? 'active' : ''}`}
              onClick={() => handleFilterClick(null)}
            >
              すべて
            </button>
            <button
              type="button"
              className={`filter-tab ${filterStatus === 1 ? 'active' : ''}`}
              onClick={() => handleFilterClick(1)}
            >
              公式
            </button>
            <button
              type="button"
              className={`filter-tab ${filterStatus === 0 ? 'active' : ''}`}
              onClick={() => handleFilterClick(0)}
            >
              非公式
            </button>
          </div>

          {/* 右側: ソート機能 */}
          <div className="sort-group">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="sort-select"
            >
              <option value="default">デフォルト順</option>
              <option value="createdAt">新着順</option>
              <option value="memberCount">人数順</option>
            </select>

            <button
              type="button"
              onClick={toggleSortOrder}
              className="sort-order-button"
              title={sortOrder === 'asc' ? '昇順（少ない順/古い順）' : '降順（多い順/新しい順）'}
            >
              {sortOrder === 'asc' ? '▲' : '▼'}
            </button>
          </div>
        </div>
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
            <div className={`status-badge ${c.official === 1 ? 'official' : 'unofficial'}`}>
              {c.official === 1 ? '公式' : '非公式'}
            </div>
            
            <Link to={`/communities/${c.id}`} className="community-link" >
              <img
                src={c.thubmnailUrl || c.imageUrl || "/favicon.png"}
                alt={c.name}
                className="community-thumbnail"
              />
          
              <h2>{c.name}</h2>
              <p>{c.message}</p>
              <p className="meta-item">
                <FaUsers className="meta-icon" /> {c.memberCount}人
              </p>
              <p className="meta-item">
                <FaClock className="meta-icon" /> {c.activityTime}
                </p>
                
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
