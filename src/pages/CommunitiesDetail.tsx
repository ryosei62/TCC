// CommunityDetail.tsx
//　DBからデータを取得してる方！
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom' // or useRouter if Next.js
import { Link } from 'react-router-dom'

type Community = {
  name: string
  message: string
  memberCount: number
  activityDescription: string
  activityTime: string
  activityLocation: string
  contact: string
  url: string;
  imageUrl: string;
}

export default function CommunityDetail() {
  const { id } = useParams()
  const [community, setCommunity] = useState<Community | null>(null)

  useEffect(() => {
    const fetchCommunity = async () => {
      const docRef = doc(db, 'communities', id as string)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        setCommunity(docSnap.data() as Community)
      } else {
        console.log('コミュニティが見つかりません')
      }
    }

    fetchCommunity()
  }, [id])

  if (!community) return <p>読み込み中...</p>

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <Link to="/">← 一覧へ戻る</Link>
      <h1>{community.name}</h1>

      {/* 画像がある場合だけ表示 */}
      {community.imageUrl && (
        <img
          src={community.imageUrl}
          alt={community.name}
          style={{
            width: "100%",
            maxWidth: "400px",
            borderRadius: "8px",
            marginTop: "12px",
          }}
        />
      )}

      <p><strong>一言メッセージ:</strong> {community.message}</p>
      <p><strong>構成人数:</strong> {community.memberCount}</p>
      <p><strong>活動内容:</strong> {community.activityDescription}</p>
      <p><strong>活動時間:</strong> {community.activityTime}</p>
      <p><strong>活動場所:</strong> {community.activityLocation}</p>
      <p><strong>連絡先:</strong> {community.contact}</p>
      <p><strong>URL:</strong><a href= {community.url}> {community.url}</a></p>
    </div>
  )
}
