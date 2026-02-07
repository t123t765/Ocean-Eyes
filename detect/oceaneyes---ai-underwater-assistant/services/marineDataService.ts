import marineData from '../marine_data_simple_array.json';

export interface MarineFishData {
  id: string;
  group: string;
  title: {
    zh: string;
    en: string;
    latin: string;
  };
  toxicity: {
    level: number;
    description: string;
  };
  image_path: string;
  details: {
    zh: string[];
    en: string[];
  };
}

export interface FishKnowledgeEntry {
  id: string;
  nameZh: string;
  nameEn: string;
  scientificName: string;
  descriptionZh: string;
  descriptionEn: string;
  isToxic: boolean;
  toxicityDescription: string;
  toxicityDescriptionEn: string;
  image_path: string;
  detailsZh: string[];
  detailsEn: string[];
}

const IMAGE_BASE_PATH = '/marine_clean_images';

const YOLO_CLASS_ID_TO_FISH_ID: Record<number, string> = {
  0: 'acanthuridae',
  1: 'balistidae',
  2: 'carangidae',
  3: 'ephippidae',
  4: 'labridae',
  5: 'lutjanidae',
  6: 'pomacanthidae',
  7: 'pomacentridae',
  8: 'scaridae',
  9: 'scombridae',
  10: 'serranidae',
  11: 'shark',
  12: 'zanclidae',
  13: 'zanclidae',
  14: 'pomacanthidae',
  15: 'pomacentridae',
  16: 'serranidae',
  17: 'carangidae',
  18: 'scaridae',
  19: 'shark',
  20: 'lutjanidae',
  21: 'ephippidae',
  22: 'acanthuridae',
  23: 'balistidae',
  24: 'scombridae',
  25: 'labridae',
};

const fishKnowledgeCache = new Map<string, FishKnowledgeEntry>();

export function getFishKnowledgeById(fishId: string): FishKnowledgeEntry | null {
  if (fishKnowledgeCache.has(fishId)) {
    return fishKnowledgeCache.get(fishId)!;
  }

  const fishData = (marineData as MarineFishData[]).find(f => f.id === fishId);
  if (!fishData) return null;

  // Generate English toxicity description based on level and species
    let toxicityDescriptionEn = '';
    switch (fishData.id) {
      case 'acanthuridae':
        toxicityDescriptionEn = 'Has sharp "scalpel" spines on both sides of the tail stalk that can cause physical cuts. Some species have mild toxicity during juvenile stages.';
        break;
      case 'balistidae':
        toxicityDescriptionEn = 'Has sharp teeth and may bite during breeding season when aggressive. Some large species may contain ciguatoxin and should not be eaten.';
        break;
      case 'carangidae':
        toxicityDescriptionEn = 'Generally non-toxic. Large predatory fish with fierce temperament but no direct toxic threat to humans.';
        break;
      case 'ephippidae':
        toxicityDescriptionEn = 'Non-toxic, gentle temperament, commonly found in ornamental fish markets.';
        break;
      case 'labridae':
        toxicityDescriptionEn = 'Mostly non-toxic. Large species like humphead wrasse need protection. Note:极少数种类体内可能有雪卡毒素。';
        break;
      case 'lutjanidae':
        toxicityDescriptionEn = 'Common food fish, no toxic spines. Large individuals may accumulate ciguatoxin.';
        break;
      case 'pomacanthidae':
        toxicityDescriptionEn = 'Non-toxic, mainly kept as ornamental fish. Has blunt spines on gill covers but no venom glands.';
        break;
      case 'pomacentridae':
        toxicityDescriptionEn = 'Generally non-toxic. Small and colorful, often found in coral reefs.';
        break;
      case 'scaridae':
        toxicityDescriptionEn = 'Non-toxic. Important for coral reef health as they help control algae growth.';
        break;
      case 'scombridae':
        toxicityDescriptionEn = 'Non-toxic. Fast-swimming pelagic fish, important commercial species.';
        break;
      case 'serranidae':
        toxicityDescriptionEn = 'Mostly non-toxic. Some large groupers may accumulate ciguatoxin.';
        break;
      case 'shark':
        toxicityDescriptionEn = 'Non-toxic. Apex predators, important for marine ecosystems.';
        break;
      case 'zanclidae':
        toxicityDescriptionEn = 'Non-toxic. Distinctive long nose, popular in aquariums.';
        break;
      default:
        toxicityDescriptionEn = fishData.toxicity.level > 0 ? 'Has some toxicity, handle with caution.' : 'Non-toxic, safe to observe.';
    }

    const entry: FishKnowledgeEntry = {
      id: fishData.id,
      nameZh: fishData.title.zh,
      nameEn: fishData.title.en,
      scientificName: fishData.title.latin,
      descriptionZh: fishData.details.zh[0] || '',
      descriptionEn: fishData.details.en[0] || '',
      isToxic: fishData.toxicity.level > 0,
      toxicityDescription: fishData.toxicity.description,
      toxicityDescriptionEn: toxicityDescriptionEn,
      image_path: `${IMAGE_BASE_PATH}/${fishData.image_path}`,
      detailsZh: fishData.details.zh,
      detailsEn: fishData.details.en,
    };

  fishKnowledgeCache.set(fishId, entry);
  return entry;
}

export function getAllFishKnowledge(): FishKnowledgeEntry[] {
  return (marineData as MarineFishData[]).map(fishData => {
    const cached = fishKnowledgeCache.get(fishData.id);
    if (cached) return cached;

    // Generate English toxicity description based on level and species
    let toxicityDescriptionEn = '';
    switch (fishData.id) {
      case 'acanthuridae':
        toxicityDescriptionEn = 'Has sharp "scalpel" spines on both sides of the tail stalk that can cause physical cuts. Some species have mild toxicity during juvenile stages.';
        break;
      case 'balistidae':
        toxicityDescriptionEn = 'Has sharp teeth and may bite during breeding season when aggressive. Some large species may contain ciguatoxin and should not be eaten.';
        break;
      case 'carangidae':
        toxicityDescriptionEn = 'Generally non-toxic. Large predatory fish with fierce temperament but no direct toxic threat to humans.';
        break;
      case 'ephippidae':
        toxicityDescriptionEn = 'Non-toxic, gentle temperament, commonly found in ornamental fish markets.';
        break;
      case 'labridae':
        toxicityDescriptionEn = 'Mostly non-toxic. Large species like humphead wrasse need protection. Note:极少数种类体内可能有雪卡毒素。';
        break;
      case 'lutjanidae':
        toxicityDescriptionEn = 'Common food fish, no toxic spines. Large individuals may accumulate ciguatoxin.';
        break;
      case 'pomacanthidae':
        toxicityDescriptionEn = 'Non-toxic, mainly kept as ornamental fish. Has blunt spines on gill covers but no venom glands.';
        break;
      case 'pomacentridae':
        toxicityDescriptionEn = 'Generally non-toxic. Small and colorful, often found in coral reefs.';
        break;
      case 'scaridae':
        toxicityDescriptionEn = 'Non-toxic. Important for coral reef health as they help control algae growth.';
        break;
      case 'scombridae':
        toxicityDescriptionEn = 'Non-toxic. Fast-swimming pelagic fish, important commercial species.';
        break;
      case 'serranidae':
        toxicityDescriptionEn = 'Mostly non-toxic. Some large groupers may accumulate ciguatoxin.';
        break;
      case 'shark':
        toxicityDescriptionEn = 'Non-toxic. Apex predators, important for marine ecosystems.';
        break;
      case 'zanclidae':
        toxicityDescriptionEn = 'Non-toxic. Distinctive long nose, popular in aquariums.';
        break;
      default:
        toxicityDescriptionEn = fishData.toxicity.level > 0 ? 'Has some toxicity, handle with caution.' : 'Non-toxic, safe to observe.';
    }

    const entry: FishKnowledgeEntry = {
      id: fishData.id,
      nameZh: fishData.title.zh,
      nameEn: fishData.title.en,
      scientificName: fishData.title.latin,
      descriptionZh: fishData.details.zh[0] || '',
      descriptionEn: fishData.details.en[0] || '',
      isToxic: fishData.toxicity.level > 0,
      toxicityDescription: fishData.toxicity.description,
      toxicityDescriptionEn: toxicityDescriptionEn,
      image_path: `${IMAGE_BASE_PATH}/${fishData.image_path}`,
      detailsZh: fishData.details.zh,
      detailsEn: fishData.details.en,
    };

    fishKnowledgeCache.set(fishData.id, entry);
    return entry;
  });
}

export function getFishKnowledgeByCategory(category: string): FishKnowledgeEntry[] {
  return getAllFishKnowledge().filter(fish => fish.group.toLowerCase() === category.toLowerCase());
}

export function searchFishKnowledge(query: string, language: 'zh' | 'en' = 'zh'): FishKnowledgeEntry[] {
  const lowerQuery = query.toLowerCase();
  return getAllFishKnowledge().filter(fish => {
    if (language === 'zh') {
      return fish.nameZh.toLowerCase().includes(lowerQuery) ||
             fish.scientificName.toLowerCase().includes(lowerQuery) ||
             fish.descriptionZh.toLowerCase().includes(lowerQuery);
    } else {
      return fish.nameEn.toLowerCase().includes(lowerQuery) ||
             fish.scientificName.toLowerCase().includes(lowerQuery) ||
             fish.descriptionEn.toLowerCase().includes(lowerQuery);
    }
  });
}

export function getToxicFish(): FishKnowledgeEntry[] {
  return getAllFishKnowledge().filter(fish => fish.isToxic);
}

export function getSafeFish(): FishKnowledgeEntry[] {
  return getAllFishKnowledge().filter(fish => !fish.isToxic);
}

export function getFishByGroup(group: string): FishKnowledgeEntry[] {
  return getAllFishKnowledge().filter(fish => fish.group.toLowerCase() === group.toLowerCase());
}

export function getFishKnowledgeByYoloClassId(yoloClassId: number): FishKnowledgeEntry | null {
  const fishId = YOLO_CLASS_ID_TO_FISH_ID[yoloClassId];
  if (!fishId) return null;
  return getFishKnowledgeById(fishId);
}

export const MARINE_FISH_KNOWLEDGE = getAllFishKnowledge();
