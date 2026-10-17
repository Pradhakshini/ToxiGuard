import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import InputPanel from "./components/InputPanel";
import ResultPanel from "./components/ResultPanel";
import FeatureCards from "./components/FeatureCards";
import Disclaimer from "./components/Disclaimer";
import AboutModal from "./components/AboutModal";
import { moleculeExamples } from "./data/examples";
import referenceReports from "./data/referenceReports.json";
import {
  analyzeFileWithBackend,
  analyzeMoleculeWithBackend,
  analyzePeptideWithBackend,
} from "./utils/api";

export default function App() {
  const [type, setType] = useState("molecule");
  const [inputMode, setInputMode] = useState("text");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("toxiguard-theme") === "dark";
  });

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("toxiguard-theme", darkMode ? "dark" : "light");

    return () => {
      document.body.classList.remove("dark");
    };
  }, [darkMode]);

  function changeType(nextType) {
    setType(nextType);
    setResult(null);
    setError("");
    setText("");
    setFileName("");
    setSelectedFile(null);
  }

  async function runAnalysis() {
    if (!text.trim()) {
      setError("Enter a molecule or peptide sequence, or upload a file first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let nextResult;

      // Use curated, source-linked reports for the three built-in examples.
      // Other inputs continue to use the FastAPI backend.
      if (type === "molecule" && inputMode === "text") {
        const cleanInput = text.trim();

        const matchingExample = Object.entries(moleculeExamples).find(
          ([name, smiles]) =>
            name.toLowerCase() === cleanInput.toLowerCase() ||
            smiles.toLowerCase() === cleanInput.toLowerCase()
        );

        if (matchingExample) {
          const [name, smiles] = matchingExample;
          const saved = referenceReports.compounds?.[name];

          if (saved) {
            nextResult = {
              name,
              input: smiles,
              identifierType: "SMILES",
              molecularFormula: saved.formula,
              molecularWeight: saved.properties.molecularWeight,
              logP: saved.properties.logP,
              tpsa: saved.properties.tpsa,
              hBondDonors: saved.properties.hBondDonors,
              hBondAcceptors: saved.properties.hBondAcceptors,
              rotatableBonds: saved.properties.rotatableBonds,
              ringCount: name === "Caffeine" ? 2 : 1,
              aromaticRings: name === "Caffeine" ? 2 : 1,
              formalCharge: 0,
              score: null,
              risk: "Curated reference report",
              alerts: [],
              reasons: [],
              engine: "ToxiGuard curated reference data",
              isPreloadedReference: true,
              pubchem: {
                cid: saved.pubchemCid,
                formula: saved.formula,
              },
              referenceReport: saved,
            };
          } else {
            nextResult = await analyzeMoleculeWithBackend(text);
          }
        } else {
          nextResult = await analyzeMoleculeWithBackend(text);
        }
      } else if (
        type === "molecule" &&
        inputMode === "file" &&
        selectedFile
      ) {
        nextResult = await analyzeFileWithBackend(selectedFile);
      } else if (type === "peptide") {
        nextResult = await analyzePeptideWithBackend(text);
      } else {
        nextResult = await analyzeMoleculeWithBackend(text);
      }

      setResult(nextResult);
    } catch (requestError) {
      setResult(null);
      setError(
        requestError.message ||
          "Could not connect to the ToxiGuard backend."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleFile(file) {
    if (!file) return;

    setFileName(file.name);
    setSelectedFile(file);
    setError("");
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => setText(String(event.target?.result ?? ""));
    reader.onerror = () => setError("Could not read this file. Try another file.");
    reader.readAsText(file);
  }

  function exportResult() {
    if (!result) return;

    const payload = JSON.stringify(
      {
        tool: "ToxiGuard",
        inputType: type,
        result,
      },
      null,
      2
    );

    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "toxiguard-result.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`app ${darkMode ? "dark" : ""}`}>
      <Header
        onAbout={() => setShowAbout(true)}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((current) => !current)}
      />

      <main>
        <Hero />

        {error && (
          <div className="apiError" role="alert">
            <strong>Analysis message:</strong> {error}
            <span>
              For non-example inputs, make sure the ToxiGuard FastAPI backend is
              running at http://127.0.0.1:8000.
            </span>
          </div>
        )}

        <section className="workspace">
          <InputPanel
            type={type}
            setType={changeType}
            inputMode={inputMode}
            setInputMode={setInputMode}
            text={text}
            setText={(value) => {
              setText(value);
              setResult(null);
              setError("");
            }}
            fileName={fileName}
            onFile={handleFile}
            onRun={runAnalysis}
            loading={loading}
          />

          <ResultPanel result={result} type={type} onExport={exportResult} />
        </section>

        <FeatureCards />
        <Disclaimer />
      </main>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}
