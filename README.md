# ToxiGuard v0.3

ToxiGuard is a research/educational in-silico toxicity screening prototype for small molecules and peptides.

## Stack
- React + Vite frontend
- FastAPI backend
- RDKit cheminformatics engine
- PubChem PUG-REST for optional compound-name → structure resolution

## Current capabilities
### Small molecules
- SMILES or compound-name input
- PubChem name resolution when the backend has internet access
- RDKit molecular descriptors
- Formula, canonical SMILES and exact mass
- Structural-alert screening using RDKit BRENK filters
- Transparent screening score and contributing signals
- Single-molecule and batch API analysis
- SDF, MOL, SMILES/TXT and simple CSV file parsing through the backend API

### Peptides
- Raw sequence or FASTA-style input
- Sequence length and molecular weight
- Kyte-Doolittle average hydrophobicity
- Hydrophobic/aromatic/cysteine fractions
- Basic/acidic residue counts
- Charge proxy and approximate net charge at pH 7
- Transparent sequence-level screening signals

## Intentionally out of scope
ADME prediction is not included in this version.

## Important scientific limitation
The current screening score is a transparent rule-based signal, not a calibrated probability of toxicity. Endpoint-specific toxicity ML models are not connected yet. A future model layer should use curated public datasets, explicit train/test separation, cross-validation, endpoint-specific metrics and applicability-domain checks before presenting model predictions.

## Run
### Frontend
```powershell
npm install
npm run dev
```

### Backend
```powershell
cd backend
..\\.venv\\Scripts\\Activate.ps1
python -m pip install -r requirements.txt
uvicorn main:app --reload
```

Backend docs: http://127.0.0.1:8000/docs
Frontend: http://localhost:5173/
