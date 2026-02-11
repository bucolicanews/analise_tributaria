export interface NcmEntry {
  NCM: number;
  cClassTrib: number;
  uTrib: string;
  dIniVig: string;
  dFimVig: string | null;
}

export const ncmData: NcmEntry[] = [
  {
    "NCM": 1012100,
    "cClassTrib": 400001,
    "uTrib": "cab",
    "dIniVig": "2026-01-01",
    "dFimVig": null
  },
  {
    "NCM": 1012900,
    "cClassTrib": 400001,
    "uTrib": "cab",
    "dIniVig": "2026-01-01",
    "dFimVig": null
  },
  {
    "NCM": 1013000,
    "cClassTrib": 400001,
    "uTrib": "cab",
    "dIniVig": "2026-01-01",
    "dFimVig": null
  },
  {
    "NCM": 1022110,
    "cClassTrib": 400001,
    "uTrib": "cab",
    "dIniVig": "2026-01-01",
    "dFimVig": null
  },
  {
    "NCM": 1022190,
    "cClassTrib": 400001,
    "uTrib": "cab",
    "dIniVig": "2026-01-01",
    "dFimVig": null
  }
];