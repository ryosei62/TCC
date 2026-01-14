// CommunitiesList.tsx
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/config";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaUsers, FaClock, FaUserCircle } from "react-icons/fa";
import { onAuthStateChanged, User } from "firebase/auth";
import "./CommunityList.css";

// ★ 追加：お気に入り操作（CommunityDetailと同じもの）
import { addFavorite, removeFavorite } from "../component/favorite";

type Community = {
  id: string;
  name: string;
  message: string;
  memberCount: string;
  activityTime: string;
  thubmnailUrl?: string;
  imageUrl?: string;
  tags: string[];
  official: number; // 1=公式, 0=非公式（表示側と統一推奨）
  createdAt?: number;
};

type SortKey = "createdAt" | "memberCount";
type SortOrder = "asc" | "desc";

export default function CommunitiesList() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<number[] | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const navigate = useNavigate();
  const [filterFavOnly, setFilterFavOnly] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState<string>("（読み込み中…）");
  const [isAdmin, setIsAdmin] = useState(false);


  // ★ 追加：お気に入り状態（communityId の集合）
  const [favoriteSet, setFavoriteSet] = useState<Set<string>>(new Set());
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const ROWS_PER_PAGE = 10;

  const listRef = useRef<HTMLUListElement | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerRow, setItemsPerRow] = useState(1);


  // ログイン監視
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setIsOpen(false);
        setFavoriteSet(new Set());
      }
    });
    return () => unsub();
  }, []);

  // コミュニティ一覧取得
  useEffect(() => {
    const fetchCommunities = async () => {
      const querySnapshot = await getDocs(collection(db, "communities"));
      const results: Community[] = [];
      querySnapshot.forEach((d) => {
        const data = d.data() as any;
        results.push({
          id: d.id,
          name: data.name,
          message: data.message,
          memberCount: data.memberCount || "",
          activityTime: data.activityTime,
          thubmnailUrl: data.thumbnailUrl,
          imageUrl: data.imageUrl || "",
          tags: data.tags || [],
          official: Number(data.official ?? 0),
          createdAt: data.createdAt
            ? data.createdAt.toMillis
              ? data.createdAt.toMillis()
              : data.createdAt
            : undefined,
        });
      });
      setCommunities(results);
    };

    fetchCommunities();
  }, []);

  // ユーザー名取得
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

  // ★ お気に入り一覧（IDだけ）を取得
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!currentUser) return;

      setFavoriteLoading(true);
      try {
        const favRef = collection(db, "users", currentUser.uid, "favorites");
        const favSnap = await getDocs(query(favRef, orderBy("createdAt", "desc")));
        const ids = favSnap.docs
          .map((d) => (d.data() as any).communityId as string)
          .filter(Boolean);

        setFavoriteSet(new Set(ids));
      } finally {
        setFavoriteLoading(false);
      }
    };

    fetchFavorites();
  }, [currentUser]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;

      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data() as any;
        setUsername(data.username ?? "（ユーザー名未設定）");

        // ★ 管理者判定（例：role が admin）
        setIsAdmin(data.role === "admin");
      } else {
        setUsername("（ユーザー名未設定）");
        setIsAdmin(false);
      }
    };

    fetchProfile();
  }, [currentUser]);


  // 人数ソート用
  const getMemberCountValue = (str: string) => {
    const match = str.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const sortedCommunities = useMemo(() => {
    return [...communities].sort((a, b) => {
      let aVal = 0;
      let bVal = 0;

      if (sortKey === "createdAt") {
        aVal = a.createdAt ?? 0;
        bVal = b.createdAt ?? 0;
      } else {
        aVal = getMemberCountValue(a.memberCount);
        bVal = getMemberCountValue(b.memberCount);
      }

      const diff = aVal - bVal;
      return sortOrder === "asc" ? diff : -diff;
    });
  }, [communities, sortKey, sortOrder]);

  const filteredCommunities = useMemo(() => {
    return sortedCommunities.filter((c) => {
      const statusMatch = filterStatus === null || filterStatus.includes(c.official);

      let keywordMatch = true;
      if (searchQuery) {
        const normalizedQuery = searchQuery.toLowerCase();
        keywordMatch =
          c.name.toLowerCase().includes(normalizedQuery) ||
          c.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));
      }

      const favMatch = !filterFavOnly || favoriteSet.has(c.id);

      return statusMatch && keywordMatch && favMatch;
    });
  }, [sortedCommunities, filterStatus, searchQuery, filterFavOnly, favoriteSet]);

  const sameArray = (a: number[] | null, b: number[]) => {
    if (!a) return false;
    if (a.length !== b.length) return false;
    const sa = [...a].sort((x, y) => x - y);
    const sb = [...b].sort((x, y) => x - y);
    return sa.every((v, i) => v === sb[i]);
  };

  const measureItemsPerRow = () => {
    const ul = listRef.current;
    if (!ul) return;

    const children = Array.from(ul.children) as HTMLElement[];
    if (children.length === 0) {
      setItemsPerRow(1);
      return;
    }

    // 先頭行と同じ offsetTop の要素を数える = 1行の個数
    const firstTop = children[0].offsetTop;
    let count = 0;
    for (const el of children) {
      if (el.offsetTop !== firstTop) break;
      count++;
    }
    setItemsPerRow(Math.max(1, count));
  };

  useEffect(() => {
    // 描画後に計測したいので requestAnimationFrame を挟む
    const raf = requestAnimationFrame(() => measureItemsPerRow());
    return () => cancelAnimationFrame(raf);
  }, [filteredCommunities.length, filterStatus, searchQuery, filterFavOnly, sortKey, sortOrder]);

  useEffect(() => {
    const ul = listRef.current;
    if (!ul) return;

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => measureItemsPerRow());
    });
    ro.observe(ul);

    // window resizeでも念のため
    const onResize = () => requestAnimationFrame(() => measureItemsPerRow());
    window.addEventListener("resize", onResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const pageSize = itemsPerRow * ROWS_PER_PAGE;

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredCommunities.length / pageSize));
  }, [filteredCommunities.length, pageSize]);

  // ページが範囲外になったら戻す（列数が変わると起きやすい）
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pagedCommunities = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCommunities.slice(start, start + pageSize);
  }, [filteredCommunities, page, pageSize]);



  const handleSearch = () => setSearchQuery(searchTerm.trim());
  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    setSearchTerm(tag);
  };
  const handleFilterClick = (status: number[] | null) => setFilterStatus(status);
  const toggleSortOrder = () =>
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));

  // ★ 一覧用：お気に入り切り替え（communityごと）
  const handleToggleFavorite = async (communityId: string) => {
    if (!currentUser) return;

    const next = !favoriteSet.has(communityId);

    // 楽観更新
    setFavoriteSet((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(communityId);
      else copy.delete(communityId);
      return copy;
    });

    try {
      if (next) await addFavorite(currentUser.uid, communityId);
      else await removeFavorite(currentUser.uid, communityId);
    } catch (e) {
      // 失敗したら戻す
      setFavoriteSet((prev) => {
        const copy = new Set(prev);
        if (next) copy.delete(communityId);
        else copy.add(communityId);
        return copy;
      });
      console.error("favorite toggle error:", e);
      alert("お気に入りの更新に失敗しました");
    }
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

          {isOpen && (
            <div className="user-menu-backdrop" onClick={() => setIsOpen(false)} />
          )}

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
                <div className="user-menu-name">{username || "名無しユーザー"}</div>
                <div className="user-menu-email">{currentUser.email}</div>
                <div className="user-menu-verified">
                  {currentUser.emailVerified ? "✅ メール認証済み" : "❌ メール未認証"}
                </div>
              </div>

              <nav className="user-menu-nav">
                <Link
                  to={`/mypage/${currentUser.uid}`}
                  onClick={() => setIsOpen(false)}
                  className="user-menu-link"
                >
                  マイページ
                </Link>
              </nav>

              <button
                type="button"
                className="user-menu-logout"
                onClick={async () => {
                  await auth.signOut();
                  setIsOpen(false);
                  navigate("/");
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
        <Link to="/timeline" className="timeline header-link">
          <h2>タイムライン</h2>
        </Link>
        <Link to="/about" className="header-link">
          <h2>TCCについて</h2>
        </Link>
      </div>

      <div className="controls-container">
        <div className="search-area">
          <input
            type="text"
            placeholder="キーワードで探す"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <button type="button" className="search-button" onClick={handleSearch}>
            検索
          </button>
        </div>

        <div className="filters-sort-row">
          <div className="filter-buttons-group">
            <button
              type="button"
              className={`filter-tab ${filterStatus === null ? "active" : ""}`}
              onClick={() => handleFilterClick(null)}
            >
              すべて
            </button>

            <button
              type="button"
              className={`filter-tab ${
                sameArray(filterStatus, [1]) ? "active" : ""
              }`}
              onClick={() => handleFilterClick([1])}
            >
              公式
            </button>

            <button
              type="button"
              className={`filter-tab ${
                sameArray(filterStatus, [0, 2]) ? "active" : ""
              }`}
              onClick={() => handleFilterClick([0, 2])}
            >
              非公式
            </button>

            {isAdmin && (
              <button
                type="button"
                className={`filter-tab ${
                  sameArray(filterStatus, [2]) ? "active" : ""
                }`}
                onClick={() => handleFilterClick([2])}
              >
                申請中
              </button>
            )}

            <button
              type="button"
              className={`filter-tab ${filterFavOnly ? "active" : ""}`}
              onClick={() => setFilterFavOnly((v) => !v)}
              disabled={!currentUser}
              title={!currentUser ? "ログインすると使えます" : ""}
            >
              ★お気に入り
            </button>
          </div>

          <div className="sort-group">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="sort-select"
            >
              <option value="createdAt">新着順</option>
              <option value="memberCount">人数順</option>
            </select>

            <button
              type="button"
              onClick={toggleSortOrder}
              className="sort-order-button"
              title={
                sortOrder === "asc"
                  ? "昇順（少ない順/古い順）"
                  : "降順（多い順/新しい順）"
              }
            >
              {sortOrder === "asc" ? "▲" : "▼"}
            </button>
          </div>
        </div>
      </div>

      {/* ページネーション（一覧の上） */}
      {filteredCommunities.length > 0 && (
        <div className="pagination">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            ← 前へ
          </button>

          <span style={{ margin: "0 12px" }}>
            {page} / {totalPages}（1ページ: {pageSize}件）
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            次へ →
          </button>
        </div>
      )}

      <ul className="community-ul" ref={listRef}>
        {filteredCommunities.length === 0 ? (
          <p>該当するコミュニティはありません。</p>
        ) : (
          pagedCommunities.map((c) => {
            const isFav = favoriteSet.has(c.id);

            return (
              <li key={c.id} className="community-list-item">
                {c.official === 1 && <div className="status-badge official">公式</div>}

                <Link to={`/communities/${c.id}`} className="community-link">
                  <img
                    src={c.thubmnailUrl || c.imageUrl || "/favicon.png"}
                    alt={c.name}
                    className="community-thumbnail"
                  />

                  <h2>{c.name}</h2>
                  <p>{c.message}</p>
                  <p className="meta-item">
                    <FaUsers className="meta-icon" /> {c.memberCount}
                  </p>
                  <p className="meta-item">
                    <FaClock className="meta-icon" /> {c.activityTime}
                  </p>
                </Link>

                {currentUser && (
                  <button
                    type="button"
                    onClick={() => handleToggleFavorite(c.id)}
                    disabled={favoriteLoading}
                    style={{
                      marginTop: 8,
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: "1px solid #ddd",
                      background: "#fff",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    {isFav ? "★ お気に入り解除" : "☆ お気に入り"}
                  </button>
                )}

                <div className="community-tags-container">
                  {c.tags.map((tag) => (
                    <span
                      key={tag}
                      className="community-tag-pill"
                      onClick={() => handleTagClick(tag)}
                      style={{ cursor: "pointer" }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </li>
            );
          })
        )}
      </ul>

      {filteredCommunities.length > 0 && (
        <div className="pagination">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            ← 前へ
          </button>

          <span style={{ margin: "0 12px" }}>
            {page} / {totalPages}（1ページ: {pageSize}件）
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            次へ →
          </button>
        </div>
      )}

      <a
        href="https://forms.gle/47FQGmhbneiYNm47A"
        target="_blank"
        rel="noopener noreferrer"
        className="form"
      >
        <h3>通報・不具合報告フォーム</h3>
      </a>
    </div>
  );
}
