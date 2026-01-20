import './About.css'; // Aboutと同じスタイルを利用
import tourokuImage from '../assets/AboutImage/shot_touroku.png';

export const HowJoin = () => {
  return (
    <div className="feature-content" style={{padding: '20px'}}>
      <h1 className="section-title" style={{textAlign: 'center', marginBottom: '30px'}}>
        <span className="en-heading">01. JOIN US</span><br /><br />
        <span className="jp-heading">アカウント登録の方法</span>
      </h1>

      <div className="feature-text">
        <p>TCC（Tsukuba Casual Community）への参加は非常にシンプルです。</p>
        <br />
        <h3>必要なもの</h3>
        <ul className="feature-list">
          <li>筑波大学発行のメールアドレス（@u.tsukuba.ac.jp など）</li>
          <li>パスワード</li>
        </ul>
        <br />
        <p>
          トップページの「新規登録」ボタンから、メールアドレスを入力してください。<br />
          認証メールが届いたら、リンクをクリックして登録完了です。<br />
          学内メールアドレスに限定することで、安心できるコミュニティ環境を維持しています。
        </p>
      </div>
      
      <div style={{ textAlign: 'center', margin: '40px 0' }}>
        <img src={tourokuImage} alt="アカウント登録画面" style={{ maxWidth: '600px', width: '80%', height: 'auto', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', display: 'block', margin: '0 auto' }} />
      </div>
    </div>
  );
};