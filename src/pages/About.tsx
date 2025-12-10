import { useState } from 'react';
import { Link } from "react-router-dom"
import './About.css';

export const About = () => {
    // 現在表示しているセクションを管理するstate (デフォルトは 'about')
    const [activeSection, setActiveSection] = useState<'about' | 'signup' | 'find' | 'create'>('about');

    return (
        <div className="about-container">
            {/* 左側：サイドバーメニュー */}
            <aside className="sidebar">
                <nav className="sidebar-nav">
                    <button 
                        className={`sidebar-btn ${activeSection === 'about' ? 'active' : ''}`}
                        onClick={() => setActiveSection('about')}
                    >
                        このプロダクトについて
                    </button>
                    <button 
                        className={`sidebar-btn ${activeSection === 'signup' ? 'active' : ''}`}
                        onClick={() => setActiveSection('signup')}
                    >
                        会員登録について
                    </button>
                    <button 
                        className={`sidebar-btn ${activeSection === 'find' ? 'active' : ''}`}
                        onClick={() => setActiveSection('find')}
                    >
                        コミュニティの探し方
                    </button>
                    <button 
                        className={`sidebar-btn ${activeSection === 'create' ? 'active' : ''}`}
                        onClick={() => setActiveSection('create')}
                    >
                        コミュニティの作り方
                    </button>
                </nav>
                
                <div className="sidebar-footer">
                    <Link to="/" className="returnList">← 一覧に戻る</Link>
                </div>
            </aside>

            {/* 右側：メインコンテンツエリア */}
            <main className="main-content">
                
                {/* 1. このプロダクトについて */}
                {activeSection === 'about' && (
                    <div className="content-fade-in">
                        <div className="logo-container">
                            <img 
                                src="/favicon.png" 
                                alt="TCCロゴ" 
                                width="40" 
                                height="40" 
                                className="main-logo" 
                            />
                        </div>
                        <h1 className="about-title">What is TCC?</h1>
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
                )}

                {/* 2. 会員登録について (新規生成) */}
                {activeSection === 'signup' && (
                    <div className="content-fade-in">
                        <h2 className="section-title">会員登録について</h2>
                        <p className="about-description">
                            TCCをフル活用するには、会員登録（無料）が必要です。
                            <br /><br />
                            <strong>1. 筑波大学メールアドレスで認証</strong><br />
                            在学生限定の安全なコミュニティを維持するため、登録には `u.tsukuba.ac.jp` などの大学発行メールアドレスを使用します。
                            <br /><br />
                            </p>
                    </div>
                )}

                {/* 3. コミュニティの探し方 (新規生成) */}
                {activeSection === 'find' && (
                    <div className="content-fade-in">
                        <h2 className="section-title">コミュニティの探し方</h2>
                        <p className="about-description">
                            あなたにぴったりの場所を見つけるための3つの方法をご紹介します。
                            <br /><br />
                            <strong>・タグ検索</strong><br />
                            「体育会」「文化系」「音楽」など、そのコミュニティが設定したタグから絞り込むことができます。
                            <br /><br />
                            <strong>・キーワード検索</strong><br />
                            自分の興味を直接入力して、関連するコミュニティを探せます。
                            <br /><br />
                            <strong>・並び替え機能</strong><br />
                            作成日時やメンバー数に応じて並び替えを行うことができます。
                        </p>
                    </div>
                )}

                {/* 4. コミュニティの作り方 (新規生成) */}
                {activeSection === 'create' && (
                    <div className="content-fade-in">
                        <h2 className="section-title">コミュニティの作り方</h2>
                        <p className="about-description">
                            既存のサークルが見つからない？それなら、新しく作ってみましょう！
                            <br /><br />
                            ログイン後、「コミュニティを作る」ボタンから申請が可能です。
                            <br /><br />
                            必要なのは情報は
                            <br />
                            ・コミュニティ名<br />
                            ・活動内容の説明<br />
                            ・代表者の連絡先<br />
                            などです。
                            <br />
                            公認団体だけでなく、期間限定のプロジェクトや、趣味の合う人を探すための非公式な集まりも大歓迎です。あなたの「やりたい」をTCCで形にしてください。
                        </p>
                    </div>
                )}
            </main>
        </div>
    )
}