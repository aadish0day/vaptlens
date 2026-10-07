/* Landing page content shared by the markup (Landing.tsx) and the scroll scene (scene.ts). */

export var PLATES = [
  "Cover",
  "Problem",
  "Ranking",
  "Pipeline",
  "Custody",
  "Install",
];

/* real output for test-data/nessus-sample.csv:
   name, cve, cvss, risk, tags, rank by CVSS, rank by VAPTLens risk */
export var BOARD: [string, string, number, number, string[], number, number][] =
  [
    ["Log4Shell", "CVE-2021-44228", 10.0, 96, [], 0, 0],
    ["Win Server 2012 EOL", "—", 10.0, 38, [], 1, 7],
    ["Zerologon", "CVE-2020-1472", 10.0, 89, [], 2, 3],
    ["BlueKeep", "CVE-2019-0708", 9.8, 93, ["KEV", "RANSOM"], 3, 1],
    ["Spring4Shell", "CVE-2022-22965", 9.8, 87, [], 4, 4],
    ["Citrix Bleed", "CVE-2023-4966", 9.4, 90, [], 5, 2],
    ["ETERNALBLUE", "CVE-2017-0144", 8.1, 78, ["KEV", "RANSOM"], 6, 5],
    ["Heartbleed", "CVE-2014-0160", 7.5, 72, [], 7, 6],
  ];

/* risk of all 17 sample findings: the beads in the WebGL scene (radius = risk) */
export var RISK = [
  96, 93, 90, 89, 87, 78, 72, 38, 29, 27, 22, 19, 18, 17, 7, 0, 0,
];

export var WORD = "VAPTLENS";
/* the wordmark is split into letters, so restore the pairs the font would kern: V·A, A·P, T·L */
export var KERN: Record<number, number> = { 0: -0.1, 1: -0.03, 3: -0.02 };

export var INSTALL_CMD =
  "cp .env.example .env   # then set POSTGRES_PASSWORD\ndocker compose up --build";
