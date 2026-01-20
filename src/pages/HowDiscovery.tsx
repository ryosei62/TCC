import './About.css';
import hakkenImage from '../assets/AboutImage/shot_hakken.png';

export const HowDiscovery = () => {
  return (
    <div className="feature-content" style={{padding: '20px'}}>
      <h1 className="section-title" style={{textAlign: 'center', marginBottom: '30px'}}>
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

      <div style={{ textAlign: 'center', margin: '40px 0' }}>
        <img src={hakkenImage} alt="コミュニティ発見画面" style={{ maxWidth: '600px', width: '80%', height: 'auto', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', display: 'block', margin: '0 auto' }} />
      </div>
    </div>
  );
};