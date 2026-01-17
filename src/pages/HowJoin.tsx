import { Link } from 'react-router-dom';
// ★ 1. CSSのインポートを変更
import './HowTo.css'; 
import tourokuImage from '../assets/AboutImage/shot_touroku.png';

export const HowJoin = () => {
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
          <span className="en-heading-sub">01. JOIN US</span>
          <span className="jp-heading">アカウント登録の方法</span>
        </div>

        {/* ★ 5. 本文エリアのクラス名を変更 */}
        <div className="howto-text">
          <p>TCC（Tsukuba Casual Community）への参加は非常にシンプルです。</p>
          
          <h3>必要なもの</h3>
          {/* リストのデザインはCSS側で調整済み、または必要に応じてHowTo.cssに追加 */}
          <ul style={{ paddingLeft: '20px', marginBottom: '30px' }}>
            <li style={{ marginBottom: '10px' }}>筑波大学発行のメールアドレス（@u.tsukuba.ac.jp など）</li>
            <li>パスワード</li>
          </ul>
          
          <p>
            トップページの「新規登録」ボタンから、メールアドレスを入力してください。<br />
            認証メールが届いたら、リンクをクリックして登録完了です。<br />
            学内メールアドレスに限定することで、安心できるコミュニティ環境を維持しています。
          </p>
        </div>
        
        {/* ★ 6. 画像エリアのクラス名を変更 */}
        <div className="howto-image-container">
          <img 
            src={tourokuImage} 
            alt="アカウント登録画面" 
            className="howto-image-small" 
          />
        </div>

        {/* ★ 7. ボタンエリアのクラス名を変更 */}
        <div className="howto-button-area">
          <Link to="/signup" className="primary-btn">
            登録ページへ進む
          </Link>
        </div>
      </main>
    </div>
  );
};