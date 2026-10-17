import React from "react";
import { CheckCircle2, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow">
          <Sparkles size={15} /> CHEMINFORMATICS
        </div>

        <h1>
          Screen {" "}
          <span className="gradientText">chemical and peptide toxicity</span>{" "}
          <span className="normaltext">in seconds.</span>
        </h1>

        <p>
          A lightweight research tool for molecular descriptors, structural
          alerts and sequence-based screening signals.
        </p>

        <div className="heroNote">
          <CheckCircle2 size={16} /> Free & open-source workflow
        </div>
      </div>

      <div
        className="heroVisual"
        aria-label="ToxiGuard molecular screening illustration"
      >
        <div className="heroGlow heroGlowOne" />
        <div className="heroGlow heroGlowTwo" />

        <div className="scienceOrb">
          <svg
            className="moleculeSvg"
            viewBox="0 0 520 390"
            role="img"
            aria-label="Abstract molecular network"
          >
            <defs>
              <linearGradient id="tgBond" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6657e8" />
                <stop offset="100%" stopColor="#27b5c7" />
              </linearGradient>

              <linearGradient id="tgNode" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#eef0ff" />
              </linearGradient>

              <filter
                id="tgShadow"
                x="-40%"
                y="-40%"
                width="180%"
                height="180%"
              >
                <feDropShadow
                  dx="0"
                  dy="10"
                  stdDeviation="12"
                  floodColor="#39327f"
                  floodOpacity="0.16"
                />
              </filter>
            </defs>

            {/* soft molecular orbit */}
            <ellipse
              cx="260"
              cy="190"
              rx="178"
              ry="118"
              fill="none"
              stroke="url(#tgBond)"
              strokeOpacity="0.16"
              strokeWidth="2"
            />

            <ellipse
              cx="260"
              cy="190"
              rx="118"
              ry="178"
              fill="none"
              stroke="#27b5c7"
              strokeOpacity="0.12"
              strokeWidth="2"
              transform="rotate(28 260 190)"
            />

            {/* bonds */}
            <g stroke="url(#tgBond)" strokeWidth="5" strokeLinecap="round">
              <line x1="260" y1="190" x2="145" y2="115" />
              <line x1="260" y1="190" x2="385" y2="112" />
              <line x1="260" y1="190" x2="390" y2="270" />
              <line x1="260" y1="190" x2="145" y2="275" />
              <line x1="145" y1="115" x2="145" y2="275" opacity="0.5" />
              <line x1="385" y1="112" x2="390" y2="270" opacity="0.5" />
            </g>

            {/* peripheral atoms */}
            <g filter="url(#tgShadow)">
              <circle cx="145" cy="115" r="35" fill="url(#tgNode)" />
              <circle cx="385" cy="112" r="35" fill="url(#tgNode)" />
              <circle cx="390" cy="270" r="35" fill="url(#tgNode)" />
              <circle cx="145" cy="275" r="35" fill="url(#tgNode)" />

              <text
                x="145"
                y="124"
                textAnchor="middle"
                className="atomText atomN"
              >
                N
              </text>
              <text
                x="385"
                y="121"
                textAnchor="middle"
                className="atomText atomO"
              >
                O
              </text>
              <text
                x="390"
                y="279"
                textAnchor="middle"
                className="atomText atomC"
              >
                C
              </text>
              <text
                x="145"
                y="284"
                textAnchor="middle"
                className="atomText atomS"
              >
                S
              </text>
            </g>

            {/* central screening core */}
            <circle
              cx="260"
              cy="190"
              r="62"
              fill="rgba(255,255,255,0.88)"
              stroke="rgba(102,87,232,0.20)"
              strokeWidth="2"
              filter="url(#tgShadow)"
            />

            <circle
              cx="260"
              cy="190"
              r="45"
              fill="url(#tgNode)"
              stroke="url(#tgBond)"
              strokeWidth="3"
            />

            <path
              d="M238 190l15 15 30-35"
              fill="none"
              stroke="#6657e8"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* tiny orbital particles */}
            <circle cx="82" cy="195" r="5" fill="#8b5cf6" opacity="0.7" />
            <circle cx="435" cy="188" r="5" fill="#27b5c7" opacity="0.7" />
            <circle cx="270" cy="55" r="4" fill="#6657e8" opacity="0.55" />
            <circle cx="278" cy="335" r="4" fill="#27b5c7" opacity="0.55" />
          </svg>

          <div className="scienceLabel">
            <span>STRUCTURE</span>
            <b>→</b>
            <span>PROFILE</span>
            <b>→</b>
            <span>SCREEN</span>
          </div>
        </div>
      </div>
    </section>
  );
}
