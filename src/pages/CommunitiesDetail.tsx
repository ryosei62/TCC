// CommunityDetail.tsx
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom' // or useRouter if Next.js

type Community = {
  name: string
  message: string
  memberCount: number
  activityDescription: string
  activityTime: string
  activityLocation: string
  contact: string
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
    <div>
      <h1>{community.name}</h1>
      <p><strong>一言メッセージ:</strong> {community.message}</p>
      <p><strong>構成人数:</strong> {community.memberCount}</p>
      <p><strong>活動内容:</strong> {community.activityDescription}</p>
      <p><strong>活動時間:</strong> {community.activityTime}</p>
      <p><strong>活動場所:</strong> {community.activityLocation}</p>
      <p><strong>連絡先:</strong> {community.contact}</p>
    </div>
  )
}
