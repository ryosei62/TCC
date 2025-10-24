// サンプルデータの方！
import React from "react";
import { useParams, Link } from "react-router-dom";
import { communities } from "../data/communities";

const CommunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const community = communities.find((c) => c.id === Number(id));

  if (!community) {
    return <div>コミュニティが見つかりません。</div>;
  }

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <Link to="/">← 一覧へ戻る</Link>
      <h1>{community.name}</h1>
      <p><strong>一言メッセージ：</strong> {community.message}</p>
      <p><strong>参加人数：</strong> {community.members}人</p>
      <p><strong>活動内容：</strong> {community.description}</p>
      <p><strong>活動頻度：</strong> {community.frequency}</p>
      <p><strong>活動場所：</strong> {community.place}</p>
    </div>
  );
};

export default CommunityDetail;
