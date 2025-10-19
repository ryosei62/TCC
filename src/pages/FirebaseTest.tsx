// src/components/FirebaseTest.jsx

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config"; // 設定ファイルをインポート

// Firestoreから取得するデータの型（例）
// ドキュメントIDも保持するようにします
interface MessageData {
  id: string;
  message: string;
}

export const FirebaseTest = () => {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true); // 最初は読み込み中

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); // 念のためもう一度trueに
      setError("");
      
      try {
        const collectionRef = collection(db, "test"); // 'test'コレクションを指定
        const snapshot = await getDocs(collectionRef);

        if (snapshot.empty) {
          console.log("No documents found in 'test' collection.");
          // データが0件だった場合
          setMessages([]); 
        } else {
          // データを取得して整形
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            message: doc.data().message || "メッセージなし" // messageフィールドが無くても動くように
          }));
          setMessages(data);
        }

      } catch (err) {
        console.error("Firestore fetch failed:", err);
        
        // 'unknown' 型のエラーハンドリング
        let errorMessage = "Firestoreとの通信に失敗しました。";
        if (err instanceof Error) {
          errorMessage += ` ${err.message}`;
          // セキュリティルール違反の場合、コンソールにも警告が出ているはずです
          if (err.message.includes("PERMISSION_DENIED")) {
            errorMessage += " (セキュリティルール違反の可能性があります)";
          }
        }
        setError(errorMessage);
        
      } finally {
        setIsLoading(false); // 成功・失敗どちらでもローディング解除
      }
    };

    fetchData();
  }, []); // 空の配列[]を指定し、初回マウント時にのみ実行

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🔥 Firebase Firestore テスト</h1>
      
      {/* 1. ローディング中の表示 */}
      {isLoading && <p>読み込み中...</p>}

      {/* 2. エラー発生時の表示 */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* 3. 成功時の表示 (ローディング中でなく、エラーもない) */}
      {!isLoading && !error && (
        <>
          {messages.length > 0 ? (
            <ul>
              {messages.map((msg) => (
                <li key={msg.id}>
                  <strong>ID:</strong> {msg.id} <br />
                  <strong>Message:</strong> {msg.message}
                </li>
              ))}
            </ul>
          ) : (
            // 4. データが0件だった時の表示
            <p>データがありません。(コレクション 'test' が空か存在しません)</p>
          )}
        </>
      )}
    </div>
  );
};