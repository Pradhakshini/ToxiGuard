// Local fallback analysis is intentionally kept as a safety net while the API is running.
// The primary path in App.jsx uses FastAPI + RDKit.

const aminoAcids = new Set("ACDEFGHIKLMNPQRSTVWY".split(""));
const hydrophobic = new Set("AILMFWVY".split(""));
const basic = new Set("KRH".split(""));
const acidic = new Set("DE".split(""));

export function cleanSequence(value = "") {
  return value
    .replace(/^>.*$/gm, "")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase();
}

export function analyzePeptide(raw) {
  const sequence = cleanSequence(raw);
  if (!sequence || [...sequence].some((aa) => !aminoAcids.has(aa))) return null;

  const length = sequence.length;
  const hydrophobicFraction = [...sequence].filter((aa) => hydrophobic.has(aa)).length / length;
  const basicCount = [...sequence].filter((aa) => basic.has(aa)).length;
  const acidicCount = [...sequence].filter((aa) => acidic.has(aa)).length;
  const charge = basicCount - acidicCount;
  const aromaticFraction = [...sequence].filter((aa) => "FWY".includes(aa)).length / length;
  const cysteineFraction = [...sequence].filter((aa) => aa === "C").length / length;

  let score = 0;
  const reasons = [];
  if (hydrophobicFraction >= 0.55) {
    score += 1.5;
    reasons.push("High hydrophobic residue fraction");
  } else if (hydrophobicFraction >= 0.45) {
    score += 0.75;
    reasons.push("Moderately high hydrophobic residue fraction");
  }
  if (Math.abs(charge) >= 5) {
    score += 1;
    reasons.push("Strong net charge tendency");
  } else if (Math.abs(charge) >= 3) {
    score += 0.5;
    reasons.push("Moderate net charge tendency");
  }
  if (aromaticFraction >= 0.2) {
    score += 0.5;
    reasons.push("Elevated aromatic residue fraction");
  }
  if (length <= 5) {
    score += 0.25;
    reasons.push("Very short peptide");
  }

  const risk = score < 1 ? "Lower screening concern" : score < 2.5 ? "Moderate screening concern" : "Higher screening concern";

  return {
    type: "peptide",
    sequence,
    length,
    hydrophobicFraction,
    basicCount,
    acidicCount,
    charge,
    aromaticFraction,
    cysteineFraction,
    score,
    risk,
    reasons,
    engine: "local fallback",
  };
}

export function analyzeMolecule(smiles) {
  const input = smiles.trim();
  if (!input) return null;

  const carbon = (input.match(/C/g) || []).length;
  const nitrogen = (input.match(/N/g) || []).length;
  const oxygen = (input.match(/O/g) || []).length;
  const sulfur = (input.match(/S/g) || []).length;
  const halogen = (input.match(/F|Cl|Br|I/g) || []).length;
  const molecularWeight = carbon * 12.01 + nitrogen * 14.01 + oxygen * 16 + sulfur * 32.06 + halogen * 35.45;
  const ringCount = Math.max(0, (input.match(/[0-9]/g) || []).length / 2);

  const alerts = [];
  const reasons = [];
  let score = 0;
  if (/C1OC1/.test(input)) {
    score += 2;
    alerts.push("Epoxide / oxirane-like structural alert");
  }
  if (/N=C=O/.test(input)) {
    score += 2;
    alerts.push("Isocyanate-like structural alert");
  }
  if (carbon > 25 && nitrogen + oxygen < 5) {
    score += 1;
    reasons.push("High carbon / low heteroatom content");
  }
  if (molecularWeight > 500) {
    score += 0.5;
    reasons.push("High molecular-weight signal");
  }

  const risk = score < 1 ? "Lower screening concern" : score < 2.5 ? "Moderate screening concern" : "Higher screening concern";

  return {
    type: "molecule",
    smiles: input,
    molecularWeight: Math.round(molecularWeight * 100) / 100,
    carbon,
    nitrogen,
    oxygen,
    sulfur,
    ringCount: Math.round(ringCount),
    aromatic: (input.match(/[cn]/g) || []).length,
    score,
    risk,
    alerts,
    reasons,
    engine: "local fallback",
  };
}
