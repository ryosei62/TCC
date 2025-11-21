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
    official: 0,
    tags: [] as string[],
  });

  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState<number>(0); // 何番目の画像をサムネイルにするか
  // const [loading, setLoading] = useState(false);

  const [snsUrlList, setSnsUrlList] = useState<{ label: string; url: string }[]>([
    { label: "", url: "" },
  ]);
  const [joinUrlList, setJoinUrlList] = useState<{ label: string; url: string }[]>([
    { label: "", url: "" },
  ]);

  const CLOUD_NAME = "dvc15z98t";
  const UPLOAD_PRESET = "community_images";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newPreviews = files.map((file) => URL.createObjectURL(file));

      // 既存リストに追加
      setImageFiles((prev) => [...prev, ...files]);
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    // インデックスずれの修正
    if (index === thumbnailIndex) setThumbnailIndex(0);
    else if (index < thumbnailIndex) setThumbnailIndex((prev) => prev - 1);
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
    
    try {
      let uploadedImageUrls: string[] = [];
      let thumbnailUrl = "";

      // 画像がある場合、並列アップロード
      if (imageFiles.length > 0) {
        uploadedImageUrls = await Promise.all(
          imageFiles.map((file) => uploadImageToCloudinary(file))
        );
        // 指定されたインデックスの画像をサムネイルURLとする（なければ0番目）
        thumbnailUrl = uploadedImageUrls[thumbnailIndex] || uploadedImageUrls[0];
      }

      // Firestoreへ保存
      await addDoc(collection(db, "communities"), {
        ...formData,

        snsUrls: snsUrlList,
        joinUrls: joinUrlList,
        imageUrls: uploadedImageUrls,// 画像URLを追加
        thumbnailUrl: thumbnailUrl,
        // ログインしないと登録できなかったため createdBy: user.uid,
        tags: selectedTags.map((tag) => tag.name),
        createdAt: serverTimestamp(), // Firestoreのサーバー時刻を使う
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
        official: 0,
        tags: [],
      });
      setImageFiles([]);
      setPreviewUrls([]);
      setThumbnailIndex(0);
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
          <p className="url">リンク一覧(SNS):</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

            {snsUrlList.map((item, index) => (
              <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input
                  type="text"
                  placeholder="サービス名 (例: Discord)"
                  value={item.label}
                  onChange={(e) => {
                    const newList = [...snsUrlList];
                    newList[index].label = e.target.value;
                    setSnsUrlList(newList);
                  }}
                  className="border p-2 rounded w-1/3"
                />
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={item.url}
                  onChange={(e) => {
                    const newList = [...snsUrlList];
                    newList[index].url = e.target.value;
                    setSnsUrlList(newList);
                  }}
                  className="border p-2 rounded w-2/3"
                />

                {/* 削除ボタン */}
                {snsUrlList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSnsUrlList(snsUrlList.filter((_, i) => i !== index));
                    }}
                    className="bg-red-500 text-white px-2 rounded"
                  >
                    −
                  </button>
                )}
              </div>
            ))}

            {/* 追加ボタン */}
            <button
              type="button"
              onClick={() => setJoinUrlList([...joinUrlList, { label: "", url: "" }])}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              ＋ URLを追加
            </button>
          </div>
        </div>

        <div className="item">
          <p className="url">リンク一覧(参加先):</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

            {joinUrlList.map((item, index) => (
              <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input
                  type="text"
                  placeholder="サービス名 (例: Discord)"
                  value={item.label}
                  onChange={(e) => {
                    const newList = [...joinUrlList];
                    newList[index].label = e.target.value;
                    setJoinUrlList(newList);
                  }}
                  className="border p-2 rounded w-1/3"
                />
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={item.url}
                  onChange={(e) => {
                    const newList = [...joinUrlList];
                    newList[index].url = e.target.value;
                    setJoinUrlList(newList);
                  }}
                  className="border p-2 rounded w-2/3"
                />

                {/* 削除ボタン */}
                {joinUrlList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setJoinUrlList(joinUrlList.filter((_, i) => i !== index));
                    }}
                    className="bg-red-500 text-white px-2 rounded"
                  >
                    −
                  </button>
                )}
              </div>
            ))}

            {/* 追加ボタン */}
            <button
              type="button"
              onClick={() => setJoinUrlList([...joinUrlList, { label: "", url: "" }])}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              ＋ URLを追加
            </button>
          </div>
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
          <p className="official">公式・非公式:</p>
          <select
            name="official"
            value={formData.official}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value={0}>非公式</option>
            <option value={1}>公式</option>
          </select>
        </div>
        
        <div className="item">
          <p className="tags">タグ:</p>
          <TagSelector
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
          />
        </div>

        {/* 画像アップロード部分 */}
        <div>
          <label className="block mb-2 font-medium">コミュニティ画像 (複数可):</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="border p-2 rounded w-full"
          />
   
          {previewUrls.length > 0 && (
            <div className="preview-area">
              <p style={{fontSize: '0.8rem', color: '#666', marginBottom: '5px'}}>
                ※画像をクリックして一覧に表示する「サムネイル」を選択してください
              </p>
              
              <div className="preview-grid">
                {previewUrls.map((url, index) => (
                  <div
                    key={index}
                    // サムネイルに選ばれている画像には枠をつけるクラス(selected)を付与
                    className={`preview-item ${thumbnailIndex === index ? "selected" : ""}`}
                    onClick={() => setThumbnailIndex(index)}
                  >
                    <img src={url} alt="プレビュー" />
                    
                    {thumbnailIndex === index && (
                      <span className="thumbnail-badge">サムネイル</span>
                    )}
                    
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={(e) => {
                        e.stopPropagation(); // 親のonClick(サムネイル選択)をキャンセル
                        handleRemoveImage(index);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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

