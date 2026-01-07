// src/firebase/favorites.ts
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export const favoriteDocRef = (uid: string, communityId: string) =>
  doc(db, "users", uid, "favorites", communityId);

export const addFavorite = async (uid: string, communityId: string) => {
  await setDoc(
    favoriteDocRef(uid, communityId),
    { communityId, createdAt: serverTimestamp() },
    { merge: true }
  );
};

export const removeFavorite = async (uid: string, communityId: string) => {
  await deleteDoc(favoriteDocRef(uid, communityId));
};
