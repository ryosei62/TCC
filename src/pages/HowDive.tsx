import { Link } from 'react-router-dom';
import './About.css';

export const HowDive = () => {
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
            <span className="en-heading">03. DIVE IN</span><br /><br />
            <span className="jp-heading">参加と交流</span>
          </h1>

          <div className="feature-text">
            <p>気になるコミュニティを見つけたら、あとは飛び込むだけです。</p>
            <br />
            
            <h3>参加リクエスト</h3>
            <p>
              コミュニティ詳細ページの「参加する」ボタンを押すと、管理人に通知が飛びます。<br />
              承認制のコミュニティの場合、管理人が承認すると正式に参加完了となります。<br />
              （誰でも歓迎のコミュニティなら、即時参加可能です）
            </p>
            <br />

            <h3>チャット・掲示板</h3>
            <p>
              参加後は、メンバー限定のチャットや掲示板にアクセスできるようになります。<br />
              自己紹介をしたり、イベントの企画に参加して、交流を深めましょう。
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};