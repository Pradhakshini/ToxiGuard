import React from "react";
import { AlertTriangle, FlaskConical, ShieldCheck } from "lucide-react";

const features = [
  { icon: FlaskConical, title: "RDKit molecular profile", text: "Real molecular descriptors including MW, LogP, TPSA, HBD/HBA, rings and charge." },
  { icon: AlertTriangle, title: "Structural screening", text: "Transparent structural-alert signals highlight patterns that warrant further review." },
  { icon: ShieldCheck, title: "Explainable output", text: "Results show the measured features and screening signals instead of hiding the reasoning behind one score." },
];

export default function FeatureCards() {
  return <section className="featureRow">{features.map(({ icon: Icon, title, text }) => <div className="feature" key={title}><div className="featureIcon"><Icon /></div><div><h3>{title}</h3><p>{text}</p></div></div>)}</section>;
}
