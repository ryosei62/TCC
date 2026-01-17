import { Link } from 'react-router-dom';
// ★ 変更: About.css ではなく HowTo.css を使う
import './HowTo.css'; 
import joinImage from '../assets/AboutImage/shot_join.png';

export const HowDive = () => {
  return (
    // クラス名を About のものから HowTo のものへ変更
    <div className="howto-container">
      <header className="howto-header">
        <Link to="/about" className="howto-return-link">
          <span className="arrow">←</span> TCCについて戻る
        </Link>
      </header>

      <main className="howto-main">
        <div className="howto-title">
          <span className="en-heading">03. DIVE IN</span>
          <span className="jp-heading">参加と交流</span>
        </div>

        <div className="howto-text">
          <p>気になるコミュニティを見つけたら、あとは飛び込むだけです。</p>
          
          <h3>参加リクエスト</h3>
          <p>
            コミュニティ詳細ページの「参加する」ボタンを押すと、管理人に通知が飛びます。<br />
            承認制のコミュニティの場合、管理人が承認すると正式に参加完了となります。<br />
            （誰でも歓迎のコミュニティなら、即時参加可能です）
          </p>

          <h3>チャット・掲示板</h3>
          <p>
            参加後は、メンバー限定のチャットや掲示板にアクセスできるようになります。<br />
            自己紹介をしたり、イベントの企画に参加して、交流を深めましょう。
          </p>
        </div>

        <div className="howto-image-container">
          <img 
            src={joinImage} 
            alt="コミュニティ参加画面" 
            className="howto-image" 
          />
        </div>

        <div className="howto-button-area">
          <Link to="/" className="primary-btn">
            コミュニティを探しに行く
          </Link>
        </div>
      </main>
    </div>
  );
};