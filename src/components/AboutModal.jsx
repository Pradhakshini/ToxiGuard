import React from "react";
import { ShieldCheck, X } from "lucide-react";

export default function AboutModal({ onClose }) {
  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close"><X /></button>
        <div className="modalIcon"><ShieldCheck /></div>
        <h2>About ToxiGuard</h2>
        <p>ToxiGuard is a research-focused toxicity screening tool for small molecules and peptides. The current release uses FastAPI and RDKit for structure validation and chemical descriptors, with transparent screening signals.</p>
        <h4>Current engine</h4>
        <p>React → FastAPI → RDKit → descriptors + structural alerts. Endpoint-specific ML models are intentionally kept separate until curated datasets, validation and applicability-domain checks are implemented.</p>
        <h4>Not included</h4>
        <p>ADME prediction is intentionally outside the current ToxiGuard scope.</p>
      </div>
    </div>
  );
}
