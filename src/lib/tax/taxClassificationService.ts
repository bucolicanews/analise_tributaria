import { cClassTribData, CClassTribEntry } from './cClassTribData';
import { cstIbsCbsData, CstIbsCbsEntry } from './cstIbsCbsData';
import { ncmData } from './ncmData';

// Create maps for efficient lookups
const cClassMap = new Map<number, CClassTribEntry>();
cClassTribData.forEach(item => {
  if (item.code !== null) {
    cClassMap.set(item.code, item);
  }
});

const cstMap = new Map<number, CstIbsCbsEntry>();
cstIbsCbsData.forEach(item => {
  if (item.code !== null) {
    cstMap.set(item.code, item);
  }
});

const ncmMap = new Map<string, number>();
ncmData.forEach(item => {
  ncmMap.set(String(item.NCM), item.cClassTrib);
});

export function findCClassByCode(code: number): CClassTribEntry | undefined {
  return cClassMap.get(code);
}

export function findCstByCode(code: number): CstIbsCbsEntry | undefined {
  return cstMap.get(code);
}

export function findCClassByNcm(ncm: string | undefined): number | null {
  if (!ncm) {
    return null;
  }

  const cleanedNcm = ncm.replace(/\./g, '');

  // Try matching from most specific to least specific
  for (let i = cleanedNcm.length; i >= 2; i--) {
    const partialNcm = cleanedNcm.substring(0, i);
    if (ncmMap.has(partialNcm)) {
      return ncmMap.get(partialNcm) as number;
    }
  }

  return null; // Return null if no match is found
}

export function getClassificationDetails(cClassCode: number) {
  const cClass = findCClassByCode(cClassCode);
  if (!cClass) {
    return null;
  }

  const cst = findCstByCode(cClass.cstCode);

  return {
    cClass,
    cst,
  };
}