import React from "react";
import {
  Activity,
  Beaker,
  Search,
  Upload,
  Zap,
  FlaskConical,
} from "lucide-react";
import { moleculeExamples, acceptedFiles } from "../data/examples";

export default function InputPanel({
  type,
  setType,
  inputMode,
  setInputMode,
  text,
  setText,
  fileName,
  onFile,
  onRun,
  loading,
}) {
  const placeholder =
    type === "molecule"
      ? "Enter a compound name or SMILES…"
      : "Enter peptide sequence or FASTA…";

  return (
    <div className="panel inputPanel">
      <div className="panelHeader">
        <div>
          <span className="kicker">01 · INPUT</span>
          <h2>What are you screening?</h2>
        </div>

        <div className="typeSwitch">
          <button
            className={type === "molecule" ? "active" : ""}
            onClick={() => setType("molecule")}
          >
            <Beaker size={16} />
            Molecule
          </button>

          <button
            className={type === "peptide" ? "active" : ""}
            onClick={() => setType("peptide")}
          >
            <Activity size={16} />
            Peptide
          </button>
        </div>
      </div>

      <div className="modeTabs">
        <button
          className={inputMode === "text" ? "selected" : ""}
          onClick={() => setInputMode("text")}
        >
          <Search size={15} />
          Text / sequence
        </button>

        <button
          className={inputMode === "file" ? "selected" : ""}
          onClick={() => setInputMode("file")}
        >
          <Upload size={15} />
          Import file
        </button>
      </div>

      {inputMode === "text" ? (
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <label className="dropzone">
          <Upload size={28} />
          <strong>Drop a file here or browse</strong>
          <span>SMILES, TXT, CSV, MOL, SDF or FASTA</span>
          <input
            type="file"
            accept={acceptedFiles}
            onChange={(event) => onFile(event.target.files?.[0])}
          />
          {fileName && <b>{fileName}</b>}
        </label>
      )}

      {type === "molecule" && inputMode === "text" && (
        <div className="examples">
          <span>Try an example:</span>

          {Object.entries(moleculeExamples).map(([name, smiles]) => (
            <button key={name} onClick={() => setText(smiles)}>
              {name}
            </button>
          ))}
        </div>
      )}

      <button className="runBtn" onClick={onRun} disabled={!text.trim() || loading}>
        <Zap size={18} />
        {loading ? "Analyzing…" : "Run toxicity screen"}
      </button>

      <div className="engineNote">
        <FlaskConical size={16} />
        <span>
          <b>Engine:</b> FastAPI · RDKit · transparent screening signals
        </span>
      </div>
    </div>
  );
}
