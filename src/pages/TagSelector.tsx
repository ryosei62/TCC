import { useState, KeyboardEvent, ChangeEvent } from "react";
import { db } from "../firebase/config";
import {
  collection,
  getDocs,
  addDoc,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import "./TagSelector.css";

// =========================
// 🔷 型定義
// =========================
export interface Tag {
  id: string;
  name: string;
  normalizedNames: string[];
}

interface TagSelectorProps {
  selectedTags: Tag[];
  setSelectedTags: (tags: Tag[]) => void;
}

// =========================
// 🔷 コンポーネント本体
// =========================
export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  setSelectedTags,
}) => {
  const [input, setInput] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);

  // ---- ひらがな・カタカナ・全角英数などを正規化 ----
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[ぁ-ん]/g, (ch) =>
        String.fromCharCode(ch.charCodeAt(0) + 0x60)
      ) // ひらがな→カタカナ
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) =>
        String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
      ) // 全角→半角
      .trim();
  };

  // ---- Firestoreから全タグ取得 ----
  const fetchTags = async (): Promise<Tag[]> => {
    const snapshot = await getDocs(collection(db, "tags"));
    return snapshot.docs.map(
      (doc: QueryDocumentSnapshot<DocumentData>) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Tag)
    );
  };

  // ---- 入力時にサジェストを更新 ----
  const handleInputChange = async (
    e: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const value = e.target.value;
    setInput(value);

    if (!value) {
      setSuggestions([]);
      return;
    }

    const normalized = normalizeText(value);
    const allTags = await fetchTags();

    // normalizedNamesに部分一致するタグをサジェスト
    const matched = allTags.filter((tag) =>
      tag.normalizedNames?.some((n) => n.includes(normalized))
    );

    setSuggestions(matched);
  };

  // ---- タグ選択時（サジェストクリック） ----
  const handleSelectTag = (tag: Tag): void => {
    if (!selectedTags.some((t) => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setInput("");
    setSuggestions([]);
  };

  // ---- 新タグ追加 ----
  const handleAddTag = async (): Promise<void> => {
    if (!input.trim()) return;

    const normalized = normalizeText(input);
    const allTags = await fetchTags();

    // 同義語チェック
    const existing = allTags.find((tag) =>
      tag.normalizedNames?.some((n) => n === normalized)
    );

    if (existing) {
      // 既に同義タグがある場合はそのタグを追加
      handleSelectTag(existing);
    } else {
      // 新タグとしてFirestoreに登録
      const newTag = {
        name: input.trim(),
        normalizedNames: [normalized],
      };
      const docRef = await addDoc(collection(db, "tags"), newTag);
      handleSelectTag({ id: docRef.id, ...newTag });
    }
  };

  // ---- Enterキーで新タグ作成 ----
  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await handleAddTag();
    }
  };

  // ---- タグ削除 ----
  const handleRemoveTag = (tag: Tag): void => {
    setSelectedTags(selectedTags.filter((t) => t.id !== tag.id));
  };

  return (
    <div className="tag-selector">
      {/* 選択済みタグ */}
      <div className="selected-tags">
        {selectedTags.map((tag) => (
          <span key={tag.id} className="tag">
            {tag.name}
            <button onClick={() => handleRemoveTag(tag)}>×</button>
          </span>
        ))}
      </div>

      {/* 入力欄 */}
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="タグを入力（例：料理、音楽、スポーツ）"
      />

      {/* サジェスト一覧 */}
      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((tag) => (
            <li key={tag.id} onClick={() => handleSelectTag(tag)}>
              {tag.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
