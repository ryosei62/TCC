import { useState } from "react";
// import { db, auth } from "../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import axios from "axios";
import { db } from "../firebase/config";
import "./CreateCommunity.css";
import { TagSelector, Tag } from "./TagSelector";
import { Link, useNavigate } from "react-router-dom";

export const CreateCommunity = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    message: "",
    activityDescription: "",
    activityLocation: "",
    activityTime: "",
    contact: "",
    url: "",
    memberCount: 0,
    tags: [] as string[],
  });

  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState<number>(0); // 一枚選ぶ


  const CLOUD_NAME = "dvc15z98t";
  const UPLOAD_PRESET = "community_images";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    setImageFiles(files);
    setPreviewUrls(files.map((f) => URL.createObjectURL(f)));
    setThumbnailIndex(0); // 最初の画像をデフォルトのサムネに
  };


    const uploadImagesToCloudinary = async (): Promise<string[]> => {
      const urls: string[] = [];

      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          formData
        );
        urls.push(res.data.secure_url);
      }

      return urls;
    };


    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        let imageUrls: string[] = [];

        if (imageFiles.length > 0) {
          imageUrls = await uploadImagesToCloudinary();
        }

      // Firestoreへ保存
      await addDoc(collection(db, "communities"), {
        ...formData,
        imageUrls,                      // 全部の画像
        thumbnailUrl: imageUrls[thumbnailIndex] || "", // ← 一覧用の1枚
        tags: selectedTags.map(tag => tag.name),
        createdAt: serverTimestamp(),
      });
      alert("コミュニティを作成しました！");

      navigate("/");

      setFormData({
        name: "",
        message: "",
        activityDescription: "",
        activityLocation: "",
        activityTime: "",
        contact: "",
        url: "",
        memberCount: 0,
        tags: [],
      });
      setImageFiles([]);
      setPreviewUrls([]);

      navigate("/");

    } catch (error) {
      console.error("コミュニティ作成エラー:", error);
      alert("作成に失敗しました");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 title">新しいコミュニティを作る</h2>

      <Link to="/" className="returnList">← 一覧に戻る</Link>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="item">
          <p className="name">コミュニティ名:</p>
          <input
            type="text"
            name="name"
            placeholder="筑波散歩会"
            value={formData.name}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
        </div>
        <div className="item">
          <p className="message">一言メッセージ:</p>
          <textarea
            name="message"
            placeholder="楽しく活動しています！"
            value={formData.message}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>
        <div className="item">
          <p className="activityDescription">活動内容:</p>
          <textarea
            name="activityDescription"
            placeholder="つくばを練り歩きます"
            value={formData.activityDescription}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>
        <div className="item">
          <p className="activityLocation">活動場所:</p>
          <input
            type="text"
            name="activityLocation"
            placeholder="つくば市内"
            value={formData.activityLocation}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>
        <div className="item">
          <p className="activityTime">活動頻度:</p>
          <input
            type="text"
            name="activityTime"
            placeholder="気が向いた時"
            value={formData.activityTime}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>
        <div className="item">
          <p className="contact">連絡先:</p>
          <input
            type="text"
            name="contact"
            placeholder="XXX@YYY.ZZZ"
            value={formData.contact}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>
        <div className="item">
          <p className="url">URL:</p>
          <input
            type="text"
            name="url"
            placeholder="https://example.com"
            value={formData.url}
            onChange={handleChange}
            className="border p-2 rounded"
        />
        </div>
        <div className="item">
          <p className="memberCount">メンバー数:</p>
          <select
            name="memberCount"
            value={formData.memberCount}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="">メンバー数を選択</option>
            {[...Array(301)].map((_, i) => (
              <option key={i} value={i}>
                {i} 人
              </option>
            ))}
          </select>
        </div>
        
        <div className="item">
          <p className="tags">タグ:</p>
          <TagSelector
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">コミュニティ画像（複数可）</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="border p-2 rounded w-full"
          />

          <div className="preview-wrapper">
            {previewUrls.map((url, index) => (
              <div
                key={index}
                className={`preview-container ${thumbnailIndex === index ? "selected" : ""}`}
                onClick={() => setThumbnailIndex(index)}
              >
                <img src={url} className="preview-image" alt={`preview-${index}`} />
              </div>
            ))}
          </div>

          <p className="text-sm mt-1">
            ※ 青枠の画像が一覧ページに表示されます
          </p>
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 createButton"
        >
          作成する
        </button>
      </form>
    </div>
  );
};


/*import React, { useState } from "react";
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
};*/