import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import axios from "axios";
import { db, auth } from "../firebase/config";
import "./CreateCommunity.css";
import { TagSelector, Tag } from "./TagSelector";
import { Link, useNavigate } from "react-router-dom";

const MEMBER_COUNT_OPTIONS = [
  "1~5人",
  "6~10人",
  "11~20人",
  "21~50人",
  "51人以上"
];

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
    memberCount: "",
    official: 0,
    joinDescription: "",
    tags: [] as string[],
  });

  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState<number>(0);

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
      setImageFiles((prev) => [...prev, ...files]);
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    if (index === thumbnailIndex) setThumbnailIndex(0);
    else if (index < thumbnailIndex) setThumbnailIndex((prev) => prev - 1);
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData
    );
    return response.data.secure_url;
  };

  const isValidUrl = (url: string) => {
    if (!url) return true; // 空文字はOK（任意項目の場合）
    try {
      new URL(url);
      return url.startsWith("http");
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 1. 必須項目のチェック
    if (!formData.name.trim() || !formData.activityDescription.trim()) {
      alert("コミュニティ名と活動内容は必須です。");
      return;
    }

    // 2. 文字数チェック (一言メッセージ)
    if (formData.message.length > 30) {
      alert("一言メッセージは30文字以内で入力してください。");
      return;
    }
    // 3. メンバー数が選択されているか
    if (!formData.memberCount) {
      alert("メンバー数を選択してください。");
      return;
    }

    // 4. URLの形式チェック
    const allUrls = [...snsUrlList, ...joinUrlList];
    for (const item of allUrls) {
      if (item.url && !isValidUrl(item.url)) {
        alert(`URLの形式が正しくありません: ${item.url}\n(http:// または https:// で始めてください)`);
        return;
      }
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("コミュニティを作成するにはログインが必要です。");
        navigate("/login");
        return;
      }
    
      let uploadedImageUrls: string[] = [];
      let thumbnailUrl = "";

      if (imageFiles.length > 0) {
        uploadedImageUrls = await Promise.all(
          imageFiles.map((file) => uploadImageToCloudinary(file))
        );
        thumbnailUrl = uploadedImageUrls[thumbnailIndex] || uploadedImageUrls[0];
      }

      await addDoc(collection(db, "communities"), {
        ...formData,
        memberCount: formData.memberCount,
        snsUrls: snsUrlList,
        joinUrls: joinUrlList,
        imageUrls: uploadedImageUrls,
        thumbnailUrl: thumbnailUrl,
        createdBy: user.uid,
        createdByEmail: user.email ?? null,
        tags: selectedTags.map((tag) => tag.name),
        createdAt: serverTimestamp(),
      });
      alert("コミュニティを作成しました！");
      navigate("/");
    } catch (error) {
      console.error("コミュニティ作成エラー:", error);
      alert("作成に失敗しました");
    }
  };

  return (
    <div className="create-container">
      <h2 className="title">新しいコミュニティを作る</h2>

      <div className="return-link-wrapper">
        <Link to="/" className="returnList">← 一覧に戻る</Link>
      </div>

      <form onSubmit={handleSubmit} className="create-form">
        <div className="item">
          <p className="label-text">コミュニティ名<span className="required">*</span>:</p>
          <input
            type="text"
            name="name"
            placeholder="筑波散歩会"
            value={formData.name}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>
        

        {/* テキストエリアなので align-top を追加 */}
        <div className="item align-top">
          <p className="label-text">一言メッセージ:</p>
          <div style={{ width: "100%" }}>
            <textarea
              name="message"
              placeholder="楽しく活動しています！（30文字以内）"
              value={formData.message}
              onChange={handleChange}
              maxLength={30} // ★ ここで制限
              className="textarea-field"
              style={{ minHeight: "60px" }}
            />
            {/* 文字数カウンター */}
            <p className={`char-counter ${formData.message.length >= 30 ? "limit" : ""}`}>
              {formData.message.length} / 30
            </p>
          </div>
        </div>

        {/* テキストエリアなので align-top を追加 */}
        <div className="item align-top">
          <p className="label-text">活動内容<span className="required">*</span>:</p>
          <textarea
            name="activityDescription"
            placeholder="活動の具体的な内容を書いてください"
            value={formData.activityDescription}
            onChange={handleChange}
            className="textarea-field"
          />
        </div>

        <div className="item">
          <p className="label-text">活動場所:</p>
          <input
            type="text"
            name="activityLocation"
            placeholder="つくば市内"
            value={formData.activityLocation}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div className="item">
          <p className="label-text">活動頻度:</p>
          <input
            type="text"
            name="activityTime"
            placeholder="気が向いた時"
            value={formData.activityTime}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div className="item">
          <p className="label-text">連絡先:</p>
          <input
            type="text"
            name="contact"
            placeholder="XXX@YYY.ZZZ"
            value={formData.contact}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        {/* テキストエリアなので align-top を追加 */}
        <div className="item align-top">
          <p className="label-text">参加方法:</p>
          <textarea
            name="joinDescription"
            placeholder="まずはTwitterのDMでお気軽にご連絡ください"
            value={formData.joinDescription}
            onChange={handleChange}
            className="textarea-field"
          />
        </div>

        {/* リスト系なので align-top を追加 */}
        <div className="item align-top">
          <p className="label-text">リンク一覧(SNS):</p>
          <div className="url-list-container">
            {snsUrlList.map((item, index) => (
              <div key={index} className="url-row">
                <input
                  type="text"
                  placeholder="サービス名"
                  value={item.label}
                  onChange={(e) => {
                    const newList = [...snsUrlList];
                    newList[index].label = e.target.value;
                    setSnsUrlList(newList);
                  }}
                  className="input-field url-label-input"
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
                  className="input-field url-value-input"
                />
                {snsUrlList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSnsUrlList(snsUrlList.filter((_, i) => i !== index))}
                    className="btn-delete"
                  >
                    −
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSnsUrlList([...snsUrlList, { label: "", url: "" }])}
              className="btn-add"
            >
              ＋ URLを追加
            </button>
          </div>
        </div>

        <div className="item align-top">
          <p className="label-text">リンク一覧(参加先):</p>
          <div className="url-list-container">
            {joinUrlList.map((item, index) => (
              <div key={index} className="url-row">
                <input
                  type="text"
                  placeholder="サービス名"
                  value={item.label}
                  onChange={(e) => {
                    const newList = [...joinUrlList];
                    newList[index].label = e.target.value;
                    setJoinUrlList(newList);
                  }}
                  className="input-field url-label-input"
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
                  className="input-field url-value-input"
                />
                {joinUrlList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setJoinUrlList(joinUrlList.filter((_, i) => i !== index))}
                    className="btn-delete"
                  >
                    −
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setJoinUrlList([...joinUrlList, { label: "", url: "" }])}
              className="btn-add"
            >
              ＋ URLを追加
            </button>
          </div>
        </div>

        <div className="item">
          <p className="label-text">メンバー数<span className="required">*</span>:</p>
          <select
            name="memberCount"
            value={formData.memberCount}
            onChange={handleChange}
            className="input-field select-field"
            required
          >
            <option value="">選択してください</option>
            {MEMBER_COUNT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* タグは縦に長くなるので align-top */}
        <div className="item align-top">
          <p className="label-text">タグ:</p>
          <div style={{ flex: 1 }}>
            <TagSelector
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
            />
          </div>
        </div>

        {/* 画像エリア */}
        <div className="image-upload-section">
          <label className="image-label">コミュニティ画像 (複数可):</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="input-field file-input"
          />

          {previewUrls.length > 0 && (
            <div className="preview-area">
              <p className="preview-note">
                ※画像をクリックして一覧に表示する「サムネイル」を選択してください
              </p>
              <div className="preview-grid">
                {previewUrls.map((url, index) => (
                  <div
                    key={index}
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
                        e.stopPropagation();
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
          className="createButton"
        >
          作成する
        </button>
      </form>
    </div>
  );
};