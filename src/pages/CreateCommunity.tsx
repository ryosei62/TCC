import { useState } from "react";
// import { db, auth } from "../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import axios from "axios";
import { db } from "../firebase/config";

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

  const [imageFile, setImageFile] = useState<File | null>(null); // 画像ファイル
  const [previewUrl, setPreviewUrl] = useState<string>(""); // プレビュー用
  // const [loading, setLoading] = useState(false);

  const CLOUD_NAME = "dvc15z98t";
  const UPLOAD_PRESET = "community_images";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    console.log("file:", file);
    console.log("upload_preset:", UPLOAD_PRESET);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData
    );

    return response.data.secure_url; // Cloudinary上の画像URL
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // const user = auth.currentUser;
    // if (!user) {
    //   alert("ログインが必要です");
    //   return;
    // }

    try {
      let imageUrl = "";
      if (imageFile) {
        // Cloudinaryにアップロード
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      // Firestoreへ保存
      await addDoc(collection(db, "communities"), {
        ...formData,
        imageUrl, // 画像URLを追加
        // ログインしないと登録できなかったため createdBy: user.uid,
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
      setImageFile(null);
      setPreviewUrl("");
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
        />
        <textarea
          name="activityDescription"
          placeholder="活動内容"
          value={formData.activityDescription}
          onChange={handleChange}
          className="border p-2 rounded"
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

        {/* 画像アップロード部分 */}
        <div>
          <label className="block mb-2 font-medium">コミュニティ画像</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="border p-2 rounded w-full"
          />
          {previewUrl && (
            <img
              src={previewUrl}
              alt="プレビュー"
              className="w-64 mt-2 rounded"
            />
          )}
        </div>

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