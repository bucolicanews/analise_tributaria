import { cClassTribData, CClassTribEntry } from './cClassTribData';
import { cstIbsCbsData, CstIbsCbsEntry } from './cstIbsCbsData';

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

export function findCClassByCode(code: number): CClassTribEntry | undefined {
  return cClassMap.get(code);
}

export function findCstByCode(code: number): CstIbsCbsEntry | undefined {
  return cstMap.get(code);
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