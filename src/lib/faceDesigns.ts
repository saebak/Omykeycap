/* ------------------------------------------------------------------ *
 * 캐릭터 얼굴 디자인 (keycap.jpg 참고 — 귀여운 반려동물 얼굴)
 * 귀·눈·코·볼터치·입을 조합해 다양한 표정을 CSS로 그려요.
 * ------------------------------------------------------------------ */
export type FaceEar = "none" | "cat" | "dog" | "bear" | "rabbit";
export type FaceEye = "dot" | "sparkle" | "closed";
export type FaceMouth = "smile" | "tiny" | "oh" | "tongue";

export interface FaceDesign {
  key: string;
  label: string;
  emoji: string; // 썸네일 등 작은 미리보기에서 쓰는 대표 이모지
  color: string; // 선택 시 함께 적용되는 추천 색
  ears: FaceEar;
  earColor: string;
  eyes: FaceEye;
  nose: boolean;
  mouth: FaceMouth;
  cheeks: boolean;
}

export const FACE_DESIGNS: FaceDesign[] = [
  {
    key: "shiba",
    label: "시바",
    emoji: "🐕",
    color: "#EAC79E",
    ears: "dog",
    earColor: "#B57C4C",
    eyes: "dot",
    nose: true,
    mouth: "smile",
    cheeks: false,
  },
  {
    key: "cat",
    label: "고양이",
    emoji: "🐱",
    color: "#F1E9DC",
    ears: "cat",
    earColor: "#CBB89B",
    eyes: "dot",
    nose: true,
    mouth: "tiny",
    cheeks: true,
  },
  {
    key: "bear",
    label: "곰",
    emoji: "🐻",
    color: "#CBA57C",
    ears: "bear",
    earColor: "#A9825A",
    eyes: "dot",
    nose: true,
    mouth: "smile",
    cheeks: false,
  },
  {
    key: "panda",
    label: "판다",
    emoji: "🐼",
    color: "#F4F4F5",
    ears: "bear",
    earColor: "#2B2F36",
    eyes: "dot",
    nose: true,
    mouth: "tiny",
    cheeks: false,
  },
  {
    key: "rabbit",
    label: "토끼",
    emoji: "🐰",
    color: "#F5EDE6",
    ears: "rabbit",
    earColor: "#EAD9CE",
    eyes: "dot",
    nose: true,
    mouth: "tiny",
    cheeks: true,
  },
  {
    key: "frog",
    label: "개구리",
    emoji: "🐸",
    color: "#AAD89B",
    ears: "none",
    earColor: "#8BBE7C",
    eyes: "sparkle",
    nose: false,
    mouth: "oh",
    cheeks: false,
  },
  {
    key: "puppy",
    label: "강아지",
    emoji: "🐶",
    color: "#F2E7D5",
    ears: "dog",
    earColor: "#9AA3AE",
    eyes: "dot",
    nose: true,
    mouth: "tongue",
    cheeks: false,
  },
  {
    key: "sleepy",
    label: "잠꾸러기",
    emoji: "😴",
    color: "#DDD6FE",
    ears: "cat",
    earColor: "#C3B8F0",
    eyes: "closed",
    nose: true,
    mouth: "tiny",
    cheeks: true,
  },
];
export const FACE_BY_KEY: Record<string, FaceDesign> = Object.fromEntries(
  FACE_DESIGNS.map((f) => [f.key, f]),
);
export const FACE_KEYS = FACE_DESIGNS.map((f) => f.key) as string[];
