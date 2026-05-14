/**
 * Converts a raw organic position (e.g., 11) into a "Page//Position" string (e.g., "2//1").
 * Assuming 10 results per page.
 */
export const formatOrganicRank = (position: number | null | undefined | string): string => {
  const pos = Number(position);
  if (pos === -1) return "Blocked";
  if (!pos || pos === 0) return "N/A";
  
  const page = Math.ceil(pos / 10);
  const posOnPage = pos % 10 === 0 ? 10 : (pos % 10);
  
  return `${page}//${posOnPage}`;
};

/**
 * Combines organic and maps ranking into the final notation.
 * Example: Rank 11 organic + Rank 3 maps -> "2//1 LL 3"
 */
export const formatFullRank = (organicRank: number | null | undefined | string, mapsRank: number | null | undefined | string): string => {
  const organicPos = Number(organicRank);
  if (organicPos === -1) return "Blocked";
  
  const organicStr = formatOrganicRank(organicRank);
  const mapsPos = Number(mapsRank);
  
  if (mapsPos && mapsPos > 0) {
    if (organicStr === "N/A") return `LL ${mapsPos}`;
    return `${organicStr} LL ${mapsPos}`;
  }
  
  return organicStr;
};
