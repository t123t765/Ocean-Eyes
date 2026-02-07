/**
 * 本地报告生成服务：基于 FISH_ENCYCLOPEDIA 知识库生成潜水报告
 * 无需 API，可离线使用
 */
import { FISH_ENCYCLOPEDIA } from '../fishEncyclopedia';
import { Detection } from '../types';

export function generateLocalDiveReport(
  detections: Detection[],
  location: string,
  lang: 'zh' | 'en' = 'zh'
): string {
  const counts: Record<number, number> = {};
  for (const d of detections) {
    counts[d.fishId] = (counts[d.fishId] || 0) + 1;
  }

  const speciesList = Object.entries(counts)
    .map(([idStr, count]) => {
      const fish = FISH_ENCYCLOPEDIA[Number(idStr)];
      if (!fish) return null;
      const name = lang === 'zh' ? fish.nameZh : fish.nameEn;
      return { fish, name, count };
    })
    .filter(Boolean) as Array<{ fish: typeof FISH_ENCYCLOPEDIA[number]; name: string; count: number }>;

  const toxicCount = speciesList.filter(s => s.fish.isToxic).reduce((sum, s) => sum + s.count, 0);
  const totalCount = detections.length;

  if (speciesList.length === 0) {
    return lang === 'zh'
      ? `本次在 ${location} 的探索中，暂未识别到鱼类。建议重新上传包含鱼类的视频或图片进行检测。`
      : `No fish species were detected during this exploration at ${location}. Try uploading a video or image with visible fish.`;
  }

  const lines: string[] = [];

  if (lang === 'zh') {
    lines.push(`## 探索概览`);
    lines.push(`您本次在 **${location}** 共识别到 **${totalCount}** 个鱼类目标，涉及 **${speciesList.length}** 个物种。`);
    lines.push(``);
    if (toxicCount > 0) {
      lines.push(`⚠️ **安全提示**：本次检测到 **${toxicCount}** 次有毒/需注意鱼类（红框标注）。请保持安全距离，切勿触碰。`);
      lines.push(``);
    }
    lines.push(`## 物种亮点`);
    for (const { fish, name, count } of speciesList) {
      const desc = fish.descriptionZh;
      const tip = fish.behaviorTipZh;
      const toxicTag = fish.isToxic ? '（⚠️ 有毒/需注意）' : '';
      lines.push(`**${name}** ${toxicTag} × ${count}`);
      lines.push(`${desc}`);
      lines.push(`*观察建议：${tip}*`);
      lines.push(``);
    }
    lines.push(`## 小结`);
    const topSpecies = speciesList.sort((a, b) => b.count - a.count)[0];
    lines.push(`本次探索中，${topSpecies?.name || ''}出现频次最高。珊瑚礁生态多样，请文明观赏、保护海洋。`);
  } else {
    lines.push(`## Dive Overview`);
    lines.push(`You identified **${totalCount}** fish targets across **${speciesList.length}** species at **${location}**.`);
    lines.push(``);
    if (toxicCount > 0) {
      lines.push(`⚠️ **Safety Note**: **${toxicCount}** toxic/caution species were detected (red boxes). Maintain distance and do not touch.`);
      lines.push(``);
    }
    lines.push(`## Species Highlights`);
    for (const { fish, name, count } of speciesList) {
      const desc = fish.descriptionEn;
      const tip = fish.behaviorTipEn;
      const toxicTag = fish.isToxic ? ' (⚠️ Toxic)' : '';
      lines.push(`**${name}** ${toxicTag} × ${count}`);
      lines.push(`${desc}`);
      lines.push(`*Tip: ${tip}*`);
      lines.push(``);
    }
    lines.push(`## Summary`);
    const topSpecies = speciesList.sort((a, b) => b.count - a.count)[0];
    lines.push(`${topSpecies?.name || ''} was the most frequently encountered species. Enjoy reef diversity responsibly.`);
  }

  return lines.join('\n');
}
