// CommunityList.tsx
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useEffect, useState } from 'react'

type Community = {
  id: string
  name: string
  message: string
  memberCount: number
}

export default function CommunitiesList() {
  const [communities, setCommunities] = useState<Community[]>([])

  useEffect(() => {
    const fetchCommunities = async () => {
      const querySnapshot = await getDocs(collection(db, 'communities'))
      const results: Community[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        results.push({
          id: doc.id,
          name: data.name,
          message: data.message,
          memberCount: data.memberCount,
        })
      })
      setCommunities(results)
    }

    fetchCommunities()
  }, [])

  return (
    <div>
      <h1>コミュニティ一覧</h1>
      <ul>
        {communities.map((c) => (
          <li key={c.id}>
            <h2>{c.name}</h2>
            <p>{c.message}</p>
            <p>メンバー数: {c.memberCount}人</p>
            <a href={`/communities/${c.id}`}>詳細を見る</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
