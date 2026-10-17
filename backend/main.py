from __future__ import annotations

import csv
import io
import math
import re
from typing import Any
from urllib.parse import quote
from urllib.request import Request, urlopen

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from rdkit import Chem
from rdkit.Chem import Crippen, Descriptors, FilterCatalog, Lipinski, rdMolDescriptors


app = FastAPI(
    title="ToxiGuard API",
    description="Cheminformatics backend for toxicity screening",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MoleculeRequest(BaseModel):
    input: str = Field(min_length=1)


class PeptideRequest(BaseModel):
    sequence: str = Field(min_length=1)


class BatchMoleculeRequest(BaseModel):
    items: list[str] = Field(min_length=1, max_length=1000)


# Kyte-Doolittle hydropathy values.
HYDROPATHY = {
    "I": 4.5, "V": 4.2, "L": 3.8, "F": 2.8, "C": 2.5,
    "M": 1.9, "A": 1.8, "G": -0.4, "T": -0.7, "S": -0.8,
    "W": -0.9, "Y": -1.3, "P": -1.6, "H": -3.2, "E": -3.5,
    "Q": -3.5, "D": -3.5, "N": -3.5, "K": -3.9, "R": -4.5,
}

# Approximate pKa values used only for a transparent sequence-level charge estimate.
PKA = {
    "N_term": 9.6,
    "C_term": 2.34,
    "D": 3.9,
    "E": 4.25,
    "H": 6.0,
    "C": 8.3,
    "Y": 10.1,
    "K": 10.5,
    "R": 12.5,
}


def _pubchem_lookup(name: str) -> dict[str, Any] | None:
    """Resolve a compound name through PubChem PUG-REST when available."""
    url = (
        "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/"
        f"{quote(name, safe='')}/property/CanonicalSMILES,IsomericSMILES,MolecularFormula/JSON"
    )
    try:
        request = Request(url, headers={"User-Agent": "ToxiGuard/0.3"})
        with urlopen(request, timeout=8) as response:
            import json
            payload = json.loads(response.read().decode("utf-8"))
        props = payload["PropertyTable"]["Properties"][0]
        smiles = props.get("SMILES") or props.get("ConnectivitySMILES")
        if not smiles:
            return None
        return {
            "cid": props.get("CID"),
            "smiles": smiles,
            "formula": props.get("MolecularFormula"),
        }
    except Exception:
        return None


def _resolve_molecule(raw_input: str) -> tuple[Chem.Mol, dict[str, Any]]:
    raw = raw_input.strip()

    # First treat the input as SMILES. This also supports many simple structure strings.
    molecule = Chem.MolFromSmiles(raw)
    if molecule is not None:
        return molecule, {"input": raw, "identifier_type": "SMILES"}

    # If it is not valid SMILES, try PubChem name resolution.
    pubchem = _pubchem_lookup(raw)
    if pubchem:
        molecule = Chem.MolFromSmiles(pubchem["smiles"])
        if molecule is not None:
            return molecule, {
                "input": raw,
                "identifier_type": "Compound name → PubChem",
                "pubchem": pubchem,
            }

    raise ValueError("Input is neither a valid SMILES string nor a compound name resolved by PubChem.")


def _brenk_alerts(molecule: Chem.Mol) -> list[str]:
    """Return RDKit BRENK structural-alert names, not toxicity diagnoses."""
    params = FilterCatalog.FilterCatalogParams()
    params.AddCatalog(params.FilterCatalogs.BRENK)
    catalog = FilterCatalog.FilterCatalog(params)
    matches = catalog.GetMatches(molecule)
    names = []
    for match in matches:
        name = match.GetDescription()
        if name not in names:
            names.append(name)
    return names


def _screen_molecule(molecule: Chem.Mol, alerts: list[str]) -> tuple[float, str, list[str]]:
    score = 0.0
    reasons: list[str] = []

    if alerts:
        score += min(3.0, 1.25 * len(alerts))
        reasons.append(f"{len(alerts)} RDKit BRENK structural alert(s) detected")

    mw = Descriptors.MolWt(molecule)
    logp = Crippen.MolLogP(molecule)
    aromatic_rings = rdMolDescriptors.CalcNumAromaticRings(molecule)

    if logp >= 5:
        score += 0.5
        reasons.append("High LogP signal")
    if mw >= 500:
        score += 0.5
        reasons.append("High molecular-weight signal")
    if aromatic_rings >= 6:
        score += 0.5
        reasons.append("High aromatic-ring count")

    score = round(score, 2)
    risk = (
        "Lower screening concern" if score < 1
        else "Moderate screening concern" if score < 2.5
        else "Higher screening concern"
    )
    return score, risk, reasons


def analyze_molecule_value(raw_input: str) -> dict[str, Any]:
    molecule, identity = _resolve_molecule(raw_input)
    alerts = _brenk_alerts(molecule)
    score, risk, reasons = _screen_molecule(molecule, alerts)

    atom_counts = {
        "C": sum(1 for a in molecule.GetAtoms() if a.GetSymbol() == "C"),
        "N": sum(1 for a in molecule.GetAtoms() if a.GetSymbol() == "N"),
        "O": sum(1 for a in molecule.GetAtoms() if a.GetSymbol() == "O"),
        "S": sum(1 for a in molecule.GetAtoms() if a.GetSymbol() == "S"),
        "F": sum(1 for a in molecule.GetAtoms() if a.GetSymbol() == "F"),
        "Cl": sum(1 for a in molecule.GetAtoms() if a.GetSymbol() == "Cl"),
        "Br": sum(1 for a in molecule.GetAtoms() if a.GetSymbol() == "Br"),
        "I": sum(1 for a in molecule.GetAtoms() if a.GetSymbol() == "I"),
    }

    return {
        "success": True,
        "type": "molecule",
        "input": identity["input"],
        "identifierType": identity["identifier_type"],
        "canonicalSmiles": Chem.MolToSmiles(molecule),
        "molecularFormula": rdMolDescriptors.CalcMolFormula(molecule),
        "molecularWeight": round(Descriptors.MolWt(molecule), 2),
        "exactMass": round(Descriptors.ExactMolWt(molecule), 4),
        "logP": round(Crippen.MolLogP(molecule), 3),
        "tpsa": round(Descriptors.TPSA(molecule), 2),
        "hBondDonors": Lipinski.NumHDonors(molecule),
        "hBondAcceptors": Lipinski.NumHAcceptors(molecule),
        "rotatableBonds": Lipinski.NumRotatableBonds(molecule),
        "heavyAtoms": molecule.GetNumHeavyAtoms(),
        "ringCount": rdMolDescriptors.CalcNumRings(molecule),
        "aromaticRings": rdMolDescriptors.CalcNumAromaticRings(molecule),
        "fractionCsp3": round(rdMolDescriptors.CalcFractionCSP3(molecule), 3),
        "formalCharge": Chem.GetFormalCharge(molecule),
        "atomCounts": atom_counts,
        "alerts": alerts,
        "reasons": reasons,
        "score": score,
        "risk": risk,
        "engine": "FastAPI + RDKit",
        "endpointModels": {
            "acuteToxicity": "not_connected",
            "mutagenicity": "not_connected",
            "carcinogenicity": "not_connected",
            "cytotoxicity": "not_connected",
            "organToxicity": "not_connected",
        },
        "pubchem": identity.get("pubchem"),
    }


def _clean_sequence(value: str) -> str:
    return re.sub(r"[^A-Za-z]", "", re.sub(r"^>.*$", "", value, flags=re.MULTILINE)).upper()


def _net_charge(sequence: str, pH: float = 7.0) -> float:
    # Henderson-Hasselbalch approximation for free termini and ionizable side chains.
    charge = 1 / (1 + 10 ** (pH - PKA["N_term"]))
    charge -= 1 / (1 + 10 ** (PKA["C_term"] - pH))
    for aa, pka in [("K", PKA["K"]), ("R", PKA["R"]), ("H", PKA["H"]), ("D", PKA["D"]), ("E", PKA["E"]), ("C", PKA["C"]), ("Y", PKA["Y"] )]:
        count = sequence.count(aa)
        if aa in {"K", "R", "H"}:
            charge += count * (1 / (1 + 10 ** (pH - pka)))
        else:
            charge -= count * (1 / (1 + 10 ** (pka - pH)))
    return charge


def _peptide_mw(sequence: str) -> float:
    residue_mass = {
        "A": 71.08, "R": 156.19, "N": 114.10, "D": 115.09, "C": 103.15,
        "E": 129.12, "Q": 128.13, "G": 57.05, "H": 137.14, "I": 113.16,
        "L": 113.16, "K": 128.17, "M": 131.20, "F": 147.17, "P": 97.12,
        "S": 87.08, "T": 101.11, "W": 186.21, "Y": 163.17, "V": 99.13,
    }
    return sum(residue_mass[aa] for aa in sequence) + 18.015


def analyze_peptide_value(raw_sequence: str) -> dict[str, Any]:
    sequence = _clean_sequence(raw_sequence)
    if not sequence or any(aa not in HYDROPATHY for aa in sequence):
        raise ValueError("Invalid peptide sequence. Use standard one-letter amino-acid codes.")

    length = len(sequence)
    hydrophobic_fraction = sum(aa in "AILMFWVY" for aa in sequence) / length
    aromatic_fraction = sum(aa in "FWY" for aa in sequence) / length
    cysteine_fraction = sequence.count("C") / length
    basic_count = sum(aa in "KRH" for aa in sequence)
    acidic_count = sum(aa in "DE" for aa in sequence)
    charge_proxy = basic_count - acidic_count
    net_charge = _net_charge(sequence)
    average_hydrophobicity = sum(HYDROPATHY[aa] for aa in sequence) / length

    score = 0.0
    reasons: list[str] = []
    if hydrophobic_fraction >= 0.55:
        score += 1.5
        reasons.append("High hydrophobic residue fraction")
    elif hydrophobic_fraction >= 0.45:
        score += 0.75
        reasons.append("Moderately high hydrophobic residue fraction")
    if abs(net_charge) >= 5:
        score += 1.0
        reasons.append("Strong net charge tendency at pH 7")
    elif abs(net_charge) >= 3:
        score += 0.5
        reasons.append("Moderate net charge tendency at pH 7")
    if aromatic_fraction >= 0.2:
        score += 0.5
        reasons.append("Elevated aromatic residue fraction")
    if length <= 5:
        score += 0.25
        reasons.append("Very short peptide")

    score = round(score, 2)
    risk = "Lower screening concern" if score < 1 else "Moderate screening concern" if score < 2.5 else "Higher screening concern"

    return {
        "success": True,
        "type": "peptide",
        "sequence": sequence,
        "length": length,
        "molecularWeight": round(_peptide_mw(sequence), 2),
        "hydrophobicFraction": round(hydrophobic_fraction, 3),
        "averageHydrophobicity": round(average_hydrophobicity, 3),
        "basicCount": basic_count,
        "acidicCount": acidic_count,
        "charge": charge_proxy,
        "netCharge": round(net_charge, 3),
        "aromaticFraction": round(aromatic_fraction, 3),
        "cysteineFraction": round(cysteine_fraction, 3),
        "score": score,
        "risk": risk,
        "alerts": [],
        "reasons": reasons,
        "engine": "FastAPI sequence analysis",
        "endpointModels": {
            "peptideToxicity": "not_connected",
        },
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "ToxiGuard API", "version": "0.3.0", "rdkit": True}


@app.post("/api/analyze/molecule")
def analyze_molecule(request: MoleculeRequest):
    try:
        return analyze_molecule_value(request.input)
    except ValueError as exc:
        return {"success": False, "error": str(exc)}


@app.post("/api/analyze/peptide")
def analyze_peptide(request: PeptideRequest):
    try:
        return analyze_peptide_value(request.sequence)
    except ValueError as exc:
        return {"success": False, "error": str(exc)}


@app.post("/api/analyze/molecule/batch")
def analyze_molecule_batch(request: BatchMoleculeRequest):
    results = []
    for index, item in enumerate(request.items, start=1):
        try:
            result = analyze_molecule_value(item)
        except ValueError as exc:
            result = {"success": False, "error": str(exc), "input": item}
        result["row"] = index
        results.append(result)
    return {"success": True, "count": len(results), "results": results}


@app.post("/api/analyze/file")
async def analyze_file(file: UploadFile = File(...)):
    """Parse common molecule/sequence file formats and return batch screening results."""
    data = await file.read()
    name = (file.filename or "").lower()

    if name.endswith(".sdf"):
        supplier = Chem.ForwardSDMolSupplier(io.BytesIO(data), sanitize=True, removeHs=False)
        items = [Chem.MolToSmiles(mol) for mol in supplier if mol is not None]
    elif name.endswith(".mol"):
        mol = Chem.MolFromMolBlock(data.decode("utf-8", errors="ignore"), sanitize=True)
        items = [Chem.MolToSmiles(mol)] if mol is not None else []
    elif name.endswith(".csv"):
        text = data.decode("utf-8", errors="ignore")
        rows = list(csv.reader(io.StringIO(text)))
        if not rows:
            items = []
        else:
            header = [cell.strip().lower() for cell in rows[0]]
            candidates = ["smiles", "canonicalsmiles", "isomericsmiles", "structure", "compound"]
            column = next((header.index(c) for c in candidates if c in header), None)
            if column is None:
                column = 0
            start = 1 if any(c in header for c in candidates) else 0
            items = [row[column].strip() for row in rows[start:] if len(row) > column and row[column].strip()]
    else:
        text = data.decode("utf-8", errors="ignore")
        items = [line.split(",")[0].strip() for line in text.splitlines() if line.strip() and not line.lstrip().startswith(">")]

    results = []
    for index, item in enumerate(items, start=1):
        try:
            result = analyze_molecule_value(item)
        except ValueError as exc:
            result = {"success": False, "error": str(exc), "input": item}
        result["row"] = index
        results.append(result)

    return {"success": True, "filename": file.filename, "count": len(results), "results": results}
