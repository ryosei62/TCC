/*import { useState } from "react";
import { db, auth } from "../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const CreateCommunity = () => {
  const [formData, setFormData] = useState({
    name: "",
    message: "",
    activityDescription: "",
    activityLocation: "",
    activityTime: "",
    contact: "",
    memberCount: 0,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("ログインが必要です");
      return;
    }

    try {
      await addDoc(collection(db, "communities"), {
        ...formData,
        createdBy: user.uid,
        createdAt: serverTimestamp(), // Firestoreのサーバー時刻を使う
      });
      alert("コミュニティを作成しました！");
      setFormData({
        name: "",
        message: "",
        activityDescription: "",
        activityLocation: "",
        activityTime: "",
        contact: "",
        memberCount: 0,
      });
    } catch (error) {
      console.error("コミュニティ作成エラー:", error);
      alert("作成に失敗しました");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">新しいコミュニティを作る</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          name="name"
          placeholder="コミュニティ名"
          value={formData.name}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <textarea
          name="message"
          placeholder="メッセージ"
          value={formData.message}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <textarea
          name="activityDescription"
          placeholder="活動内容"
          value={formData.activityDescription}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          name="activityLocation"
          placeholder="活動場所"
          value={formData.activityLocation}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="activityTime"
          placeholder="活動頻度"
          value={formData.activityTime}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="contact"
          placeholder="連絡先"
          value={formData.contact}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="number"
          name="memberCount"
          placeholder="メンバー数"
          value={formData.memberCount}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          作成する
        </button>
      </form>
    </div>
  );
};*/


import React, { useState } from "react";
import { db, auth } from "../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

export const CreateCommunity: React.FC = () => {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [activityLocation, setActivityLocation] = useState("");
  const [activityTime, setActivityTime] = useState("");
  const [contact, setContact] = useState("");
  const [url, setUrl] = useState("");
  const [memberCount, setMemberCount] = useState<number>(0);

  const [user] = useAuthState(auth); // ログイン中のユーザーを取得（いない場合は null）

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "communities"), {
        name,
        message,
        activityDescription,
        activityLocation,
        activityTime,
        contact,
        url,
        memberCount,
        createdAt: serverTimestamp(),
        createdBy: user ? user.uid : "guest_" + Math.random().toString(36).slice(2, 10), // 👈 未ログイン時は一時IDを生成
      });

      alert("コミュニティを作成しました！");
      setName("");
      setMessage("");
      setActivityDescription("");
      setActivityLocation("");
      setActivityTime("");
      setContact("");
      setUrl("");
      setMemberCount(0);
    } catch (error) {
      console.error("コミュニティ作成エラー:", error);
      alert("作成に失敗しました");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">コミュニティ作成</h1>
      {!user && (
        <p className="text-sm text-gray-500 mb-2">
          ※ ログインしていないため、一時的なユーザーとして作成されます。
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="コミュニティ名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="メッセージ"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border p-2 rounded"
        />
        <textarea
          placeholder="活動内容"
          value={activityDescription}
          onChange={(e) => setActivityDescription(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="活動場所"
          value={activityLocation}
          onChange={(e) => setActivityLocation(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="活動頻度"
          value={activityTime}
          onChange={(e) => setActivityTime(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="連絡先"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="メンバー数"
          value={memberCount}
          onChange={(e) => setMemberCount(Number(e.target.value))}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          作成する
        </button>
      </form>
    </div>
  );
};
