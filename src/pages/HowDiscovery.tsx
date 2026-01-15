import { Link } from 'react-router-dom';
import './About.css';

export const HowDiscovery = () => {
  return (
    <div className="about-container">
      <header className="top-header">
        <div className="header-left">
          <Link to="/about" className="returnList">
            <span className="arrow">←</span> Back to About
          </Link>
        </div>
      </header>

      <main className="main-content section-block">
        <div className="feature-content">
          <h1 className="section-title">
            <span className="en-heading">02. DISCOVERY</span><br /><br />
            <span className="jp-heading">コミュニティの探し方</span>
          </h1>

          <div className="feature-text">
            <p>あなたにぴったりの場所を見つけるための、3つの方法を紹介します。</p>
            <br />
            
            <h3>1. タグ検索</h3>
            <p>「音楽」「スポーツ」「プログラミング」など、興味のあるタグをクリックするだけで関連するコミュニティ一覧が表示されます。</p>
            <br />

            <h3>2. キーワード検索</h3>
            <p>ニッチな趣味や特定の活動名が決まっている場合は、検索バーにキーワードを入力してください。</p>
            <br />

            <h3>3. トレンド・新着</h3>
            <p>トップページには、今盛り上がっているコミュニティや、設立されたばかりの新しいコミュニティがピックアップされています。</p>
          </div>
        </div>
      </main>
    </div>
  );
};