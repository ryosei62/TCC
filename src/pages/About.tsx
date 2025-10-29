import { Link } from "react-router-dom"
import './About.css'; // 1. 作成したCSSファイルをインポート

export const About = () => {

    return (
        <div>
            <img 
            src="/favicon.png" 
            alt="TCCロゴ" 
            width="40" 
            height="40" 
            className="main-logo" 
          />
            <h1 className="about-title">What is TCC?</h1>
            
            <Link to="/" className="returnList">← 一覧に戻る</Link>
        
            <p className="about-description">
                TCCは筑波大生のためのコミュニティファインダーです。
                <br /><br />
                このアプリを使えば、あなたの興味や関心に合ったサークル、部活、
                勉強会、さらには非公式の趣味の集まりまで、
                筑波大学周辺のあらゆるコミュニティを簡単に見つけることができます。
                <br /><br />
                新しい友達を見つけたい、新しいことに挑戦したい、
                大学生活をもっと充実させたい。
                そんなあなたをTCCがサポートします。
            </p>
        </div>
    )
}