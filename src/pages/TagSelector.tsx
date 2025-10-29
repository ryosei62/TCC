import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

type TagSelectorProps = {
  tags: string[];
  setTags: (tags: string[]) => void;
};

export const TagSelector = ({ tags, setTags }: TagSelectorProps) => {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // 入力ごとにFirestoreから候補取得
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!input.trim()) {
        setSuggestions([]);
        return;
      }
      const q = query(collection(db, "tags"), where("name", ">=", input), where("name", "<=", input + "\uf8ff"));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map((doc) => doc.data().name as string);
      setSuggestions(fetched);
    };

    fetchSuggestions();
  }, [input]);

  // タグ追加
  const addTag = async (tag: string) => {
    if (!tag.trim() || tags.includes(tag)) return;
    setTags([...tags, tag]);

    // Firestoreに存在しないタグなら追加
    const q = query(collection(db, "tags"), where("name", "==", tag));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      await addDoc(collection(db, "tags"), {
        name: tag,
        createdAt: serverTimestamp(),
      });
    }

    setInput("");
    setSuggestions([]);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="tag-selector mt-4">
      <label className="block mb-2 font-medium">タグ（複数可）</label>

      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full cursor-pointer"
            onClick={() => removeTag(tag)}
          >
            {tag} ✕
          </span>
        ))}
      </div>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTag(input);
          }
        }}
        placeholder="タグを入力して Enter"
        className="border p-2 rounded w-full"
      />

      {suggestions.length > 0 && (
        <div className="border rounded mt-2 bg-white shadow-md">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => addTag(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
