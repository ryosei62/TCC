import { useState } from "react";
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
};
