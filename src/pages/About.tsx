import { Link } from "react-router-dom";
import './About.css';
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase/config";
import { collection,getCountFromServer,} from "firebase/firestore";
import { db } from "../firebase/config";



// 画像アセットのインポート
import sumahoWomanImage from '../assets/AboutImage/sumaho_woman.png';
import universityWatyaImage from '../assets/AboutImage/Tsukuba01.jpg'; // 背景用に追加

export const About = () => {

    const [communityCount, setCommunityCount] = useState<number | null>(null);
    const [userCount, setUserCount] = useState<number | null>(null);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const COMMUNITY_OFFSET = 0;
    const USER_OFFSET = 10;



    useEffect(() => {
    const fetchCounts = async () => {
        try {
        const communitySnap = await getCountFromServer(
            collection(db, "communities")
        );
        const userSnap = await getCountFromServer(
            collection(db, "users")
        );

        // ★ 固定値で増やす
        setCommunityCount(communitySnap.data().count + COMMUNITY_OFFSET);
        setUserCount(userSnap.data().count + USER_OFFSET);
        } catch (e) {
        console.error("count fetch error:", e);
        }
    };

    fetchCounts();
    }, []);



    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        });
        return () => unsub();
    }, []);

    return (
        <div className="about-container">
            {/* --- Header Navigation --- */}
            <header className="top-header">
                {currentUser && (
                <Link to={`/`} className="return-btn">
                    一覧に戻る
                </Link>
                )}

                <nav className="header-nav">
                    <button className="nav-btn" onClick={() => scrollToSection('concept')}>
                        CONCEPT
                    </button>
                    <button className="nav-btn" onClick={() => scrollToSection('find')}>
                        FIND
                    </button>
                    <button className="nav-btn" onClick={() => scrollToSection('create')}>
                        CREATE
                    </button>
                </nav>
            </header>

            {/* --- Main Content --- */}
            <main className="main-content">
                
                {/* 1. HERO / CONCEPT (ID: concept) */}
                {/* 背景画像を style で直接指定することで、確実に表示させます */}
                <section 
                    id="concept" 
                    className="section-block hero-section"
                    style={{ backgroundImage: `url(${universityWatyaImage})` }}
                >
                    {/* CSSの ::before で黒いフィルターがかかります */}
                    
                    <div className="text-center fade-in-up">
                        <h1 className="hero-title">
                            <span className="en-title">CONNECT. CREATE. CASUAL.</span>
                            <span className="jp-title">筑波大生の「好き」が、交差する場所。</span>
                        </h1>
                        
                        <p className="hero-description">
                            広いキャンパス、数え切れない学生。<br />
                            すれ違うだけではもったいない。<br /><br />
                            TCC（Tsukuba Casual Community）は、<br />
                            既存の枠組みを超えて、<br />
                            あなたの「好き」や「興味」でつながる<br />
                            次世代のコミュニティ・プラットフォームです。
                        </p>

                        <p className="hero-message">
                            同じ講義室にはいない、<br />
                            最高の仲間がきっと見つかる。<br />
                            あなたの大学生活に、新しい「居場所」を。
                        </p>
                    </div>
                </section>

               <div className="stats-bar">
                    <div className="stat-item">
                        <span className="stat-label">現在のコミュニティ数</span>
                        <strong className="stat-number">{communityCount !== null ? communityCount : "…"}</strong>
                        <span className="stat-unit">個</span>
                    </div>
                    <div className="stat-divider"></div> {/* PC用の区切り線 */}
                    <div className="stat-item">
                        <span className="stat-label">ユーザー数</span>
                        <strong className="stat-number">{userCount !== null ? userCount : "…"}</strong>
                        <span className="stat-unit">人</span>
                    </div>
                </div>


                {/* --- Usage Steps --- */}
                <section className="usage-section">
                    <h2 className="section-sub-title">HOW TO USE</h2>
                    <div className="steps-container">
                        {/* 01: Join Us -> /how-join */}
                        <Link to="/how-join" className="step-item">
                            <span className="step-num">01</span>
                            <h3>Join Us</h3>
                            <p>筑波大学発行のメールアドレスで<br/>簡単アカウント登録。</p>
                        </Link>

                        {/* 02: Discovery -> /how-discovery */}
                        <Link to="/how-discovery" className="step-item">
                            <span className="step-num">02</span>
                            <h3>Discovery</h3>
                            <p>タグやキーワードから、<br/>共鳴するコミュニティを探す。</p>
                        </Link>

                        {/* 03: Dive In -> /how-dive */}
                        <Link to="/how-dive" className="step-item">
                            <span className="step-num">03</span>
                            <h3>Dive In</h3>
                            <p>気になる活動へ参加リクエスト。<br/>新しい日常の始まり。</p>
                        </Link>
                    </div>
                </section>


                {/* --- CTA 1 --- */}
                {!currentUser && (
                
                <div className="cta-section">
                    <div className="cta-content">
                        <p className="cta-catch">さあ、その一歩を踏み出そう。</p>
                        <Link to="/signup" className="cta-button primary-btn">
                            無料で始める
                        </Link>
                        <p className="cta-note">※ @u.tsukuba.ac.jp 等のアドレスが必要です</p>
                    </div>
                </div>
                )}

                {/* 2. FIND (ID: find) */}
                <section id="find" className="section-block feature-section">
                    <div className="feature-content">
                        <h2 className="section-title">
                            <span className="en-heading">FIND YOUR VIBE</span><br />
                            <span className="jp-heading">共鳴する場所を探す</span>
                        </h2>
                        
                        <div className="feature-grid">
                            <div className="feature-text">
                                <p>
                                    ガチな部活から、ゆるい趣味の集まりまで。<br />
                                    TCCには多種多様なコミュニティが存在します。
                                </p>
                                <ul className="feature-list">
                                    <li><strong>TAG SEARCH</strong> - 「音楽」「プログラミング」「散歩」など直感的にタグで検索。</li>
                                    <li><strong>KEYWORD</strong> - ニッチな趣味も、キーワード検索なら見つかるかもしれない。</li>
                                    <li><strong>TREND</strong> - 今盛り上がっている新しいコミュニティをチェック。</li>
                                </ul>
                            </div>
                            <div className="feature-img-box">
                                <img 
                                    src={sumahoWomanImage} 
                                    alt="Searching on phone" 
                                    className="feature-img"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. CREATE (ID: create) */}
                <section id="create" className="section-block feature-section reverse">
                    <div className="feature-content">
                        <h2 className="section-title">
                            <span className="en-heading">IGNITE PASSION</span><br />
                            <span className="jp-heading">「好き」をカタチにする</span>
                        </h2>

                        <div className="feature-text-center">
                            <p>
                                探しても見つからないなら、作ればいい。<br />
                                TCCなら、あなたの「やりたい」がすぐにコミュニティになります。
                            </p>
                            <br />
                            <p className="create-pitch">
                                必要なのは<br />
                                <strong>「コミュニティ名」</strong>と<strong>「少しの熱量」</strong>だけ。<br /><br />
                                サークル等の公認団体である必要はありません。<br />
                                期間限定のプロジェクトも、<br />
                                深夜のラーメン同好会も、すべて大歓迎。<br />
                                ここで、あなたがリーダーになろう。
                            </p>
                        </div>
                    </div>
                </section>

                {/* --- CTA 2 --- */}
                {!currentUser && (
                
                <div className="cta-section final-cta">
                    <div className="cta-content">
                        <h2>REDEFINE YOUR CAMPUS LIFE.</h2>
                        <p>想像していなかった大学生活が、ここにある。</p>
                        <Link to="/signup" className="cta-button primary-btn large">
                            今すぐTCCに参加する
                        </Link>
                    </div>
                </div>
                )}

                {/* --- Footer --- */}
                <footer className="about-footer">
                    <div className="footer-links">
                        <Link to="/terms" className="footer-link">Terms of Service</Link>
                        <span className="separator">/</span>
                        <Link to="/privacy" className="footer-link">Privacy Policy</Link>
                    </div>
                    <p className="copyright">© 2026 Tsukuba Casual Community</p>
                </footer>

            </main>
        </div>
    )
}