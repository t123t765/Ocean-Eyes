
export enum AppMode {
  GENERAL = 'GENERAL',
  DIVING = 'DIVING',
  REPORT = 'REPORT',
  DETECT_RESULT = 'detectResult',
  COMMUNITY = 'COMMUNITY',
  SETTINGS = 'SETTINGS',
  FISH_CATALOG = 'FISH_CATALOG',
}

// 关键：Detection接口属性和App.tsx中构造的对象完全一致，无多余/缺失
export interface Detection {
  id: string;        // 对应 id: `detect-${Date.now()}`（字符串）
  type: 'fish';      // 对应 type: 'fish'（固定字面量，比string更严格）
  isToxic: boolean;  // 对应 isToxic: true/false（布尔值）
  fishId: number;    // 对应 fishId: 0/1/2...（数字）
  timestamp: string; // 对应 timestamp: new Date().toISOString()（字符串）
  position?: {       // 可选属性（加?），你没构造这个属性，不会报错
    x: number;
    y: number;
  };
}
export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  following: string[];
  followersCount: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  location: string;
  imageUrl: string;
  fishFound: string[];
  caption: string;
  likes: number;
  comments: Comment[];
  isAiGenerated: boolean;
  timestamp: number;
}

export interface MarineLife {
  id: string;
  name: string;
  scientificName: string;
  isPoisonous: boolean;
  description: string;
  toxicityLevel?: number; // 1-10
  behaviorTip: string;
  imageUrl: string;
}

export interface AIAdvice {
  species: string;
  isDangerous: boolean;
  warningText: string;
  escapeDirection?: string;
  educationalFact?: string;
}

export interface DiveSession {
  id: string;
  startTime: number;
  endTime: number;
  location: string;
  detections: Detection[];
  aiSummary: string;
  maxDepth: number;
  oxygenLevel: number; // 0-100
}
