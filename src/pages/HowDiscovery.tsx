import { Link } from 'react-router-dom';
// ★ 1. CSSのインポートを変更
import './HowTo.css'; 
import hakkenImage from '../assets/AboutImage/shot_hakken.png';

export const HowDiscovery = () => {
  return (
    // ★ 2. クラス名を 'howto-container' に変更
    <div className="howto-container">
      
      {/* ★ 3. ヘッダーのクラス名を変更 */}
      <header className="howto-header">
        <Link to="/about" className="howto-return-link">
          <span className="arrow">←</span> TCCについて戻る
        </Link>
      </header>

      {/* ★ 4. メインエリアのクラス名を変更 */}
      <main className="howto-main">
        <div className="howto-title">
          <span className="en-heading-sub">02. DISCOVERY</span>
          <span className="jp-heading">コミュニティの探し方</span>
        </div>

        {/* ★ 5. 本文エリアのクラス名を変更 */}
        <div className="howto-text">
          <p>あなたにぴったりの場所を見つけるための、3つの方法を紹介します。</p>
          
          <h3>1. タグ検索</h3>
          <p>
            「音楽」「スポーツ」「プログラミング」など、興味のあるタグをクリックするだけで関連するコミュニティ一覧が表示されます。
          </p>

          <h3>2. キーワード検索</h3>
          <p>
            ニッチな趣味や特定の活動名が決まっている場合は、検索バーにキーワードを入力してください。
          </p>

          <h3>3. トレンド・新着</h3>
          <p>
            トップページには、今盛り上がっているコミュニティや、設立されたばかりの新しいコミュニティがピックアップされています。
          </p>
        </div>

        {/* ★ 6. 画像エリアのクラス名を変更 (インラインスタイルを削除) */}
        <div className="howto-image-container">
          <img 
            src={hakkenImage} 
            alt="コミュニティ発見画面" 
            className="howto-image" 
          />
        </div>

        {/* ★ 7. ボタンエリア (他のページと統一して追加) */}
        <div className="howto-button-area">
          <Link to="/" className="primary-btn">
            コミュニティを探しに行く
          </Link>
        </div>
      </main>
    </div>
  );
};