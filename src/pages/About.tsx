import { Link } from "react-router-dom"

export const About = () => {

    return (
        <div>
            <h1>TCCについて</h1>
            <Link to="/" className="returnList">← 一覧に戻る</Link>
            <p>TCCはコミュニティに関するサービスだよ</p>
        </div>
    )
}