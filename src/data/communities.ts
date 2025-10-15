import { Community } from "../types/Community";

export const communities: Community[] = [
  {
    id: 1,
    name: "猫好きの会",
    message: "猫好き集まれ",
    members: 13,
    description:
      "大学にいる猫を探して、写真を撮ったり、餌をあげたりしています。猫カフェに行ったりもします。猫についてみんなで話しましょう。",
    frequency: "月に一回",
    place: "なし",
  },
  {
    id: 2,
    name: "映画研究会",
    message: "週末に映画鑑賞！",
    members: 25,
    description:
      "毎週土曜日に映画を鑑賞して意見交換をしています。年に一度上映会も開催！ジャンル問わず映画が好きな方歓迎です。",
    frequency: "週1回",
    place: "学生会館A棟 301",
  },
  {
    id: 3,
    name: "コーヒー同好会",
    message: "一杯のコーヒーで一息を。",
    members: 18,
    description:
      "学内カフェや近所の喫茶店を巡ってコーヒーの味を比べたり、自分たちで豆を焙煎して淹れ方を研究しています。初心者も大歓迎！",
    frequency: "隔週",
    place: "学生ラウンジ",
  },
  {
    id: 4,
    name: "プログラミング研究部",
    message: "コードで世界を変えよう！",
    members: 30,
    description:
      "初心者から上級者まで参加できるプログラミングサークル。ハッカソン参加やアプリ開発、勉強会を開催しています。",
    frequency: "週2回",
    place: "情報棟 2階 ラボ室",
  },
  {
    id: 5,
    name: "写真サークル",
    message: "瞬間を切り取る楽しさを。",
    members: 20,
    description:
      "学内外での撮影会や展示会を行っています。スマホでも一眼でもOK。季節ごとの風景やイベントを撮影して共有しています。",
    frequency: "月2回",
    place: "キャンパス内・市内各所",
  },
  {
    id: 6,
    name: "ボードゲームの会",
    message: "遊びながらつながろう！",
    members: 16,
    description:
      "ボードゲームやカードゲームを通じて交流するサークル。初心者向けのゲーム会も多く、和気あいあいとした雰囲気です。",
    frequency: "週1回",
    place: "学生ホール",
  },
  {
    id: 7,
    name: "国際交流サークル",
    message: "世界とつながる場所。",
    members: 22,
    description:
      "留学生と日本人学生が一緒に交流するサークル。英語や日本語での会話練習、文化紹介イベント、料理会などを行っています。",
    frequency: "月2回",
    place: "国際交流センター",
  },
];
