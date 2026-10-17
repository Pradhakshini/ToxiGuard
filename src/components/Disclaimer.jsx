import React from "react";
import { AlertTriangle } from "lucide-react";

export default function Disclaimer() {
  return (
    <section className="disclaimer">
      <AlertTriangle size={17} />
      <span>
        <b>Research use only:</b> ToxiGuard provides transparent cheminformatics screening signals. It is not a validated toxicology, medical or regulatory decision system.
      </span>
    </section>
  );
}
