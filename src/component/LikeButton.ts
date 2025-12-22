import { doc, runTransaction, increment, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export async function toggleLike(params: {
  communityId: string;
  postId: string;
  uid: string;
}) {
  const { communityId, postId, uid } = params;

  const postRef = doc(db, "communities", communityId, "posts", postId);
  const likeRef = doc(db, "communities", communityId, "posts", postId, "likes", uid);

  await runTransaction(db, async (tx) => {
    const likeSnap = await tx.get(likeRef);

    if (likeSnap.exists()) {
      // いいね解除
      tx.delete(likeRef);
      tx.update(postRef, { likesCount: increment(-1) });
    } else {
      // いいね追加
      tx.set(likeRef, { createdAt: serverTimestamp() });
      tx.update(postRef, { likesCount: increment(1) });
    }
  });
}
