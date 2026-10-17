
import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ShieldCheck,
  BookOpen,
  FlaskConical,
  Info,
  Pill,
  ShieldAlert,
} from "lucide-react";

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatNumber(value, digits = 2) {
  return typeof value === "number" ? value.toFixed(digits) : "—";
}

export default function ResultPanel({ result, type, onExport }) {
  return (
    <div className="panel resultPanel">
      <div className="panelHeader">
        <div>
          <span className="kicker">02 · RESULT</span>
          <h2>Toxicity screening profile</h2>
        </div>

        {result && (
          <button className="downloadBtn" onClick={onExport}>
            <Download size={16} />
            Export
          </button>
        )}
      </div>

      {!result ? (
        <EmptyState />
      ) : (
        <ResultContent result={result} type={type} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty">
      <div className="emptyIcon">
        <ShieldCheck size={34} />
      </div>
      <h3>Ready for analysis</h3>
      <p>
        Enter a structure or peptide sequence on the left to generate a
        screening profile.
      </p>
      <div className="miniSteps">
        <span><b>1</b> Parse</span>
        <i>→</i>
        <span><b>2</b> Extract features</span>
        <i>→</i>
        <span><b>3</b> Screen</span>
      </div>
    </div>
  );
}

function ResultContent({ result, type }) {
  if (Array.isArray(result.results)) {
    return <BatchResultContent result={result} />;
  }

  const isPeptide = type === "peptide";
  const isReference = Boolean(
    result.isPreloadedReference && result.referenceReport
  );

  const risk = result.risk || "Screening result unavailable";
  const riskClass = risk.startsWith("Higher")
    ? "high"
    : risk.startsWith("Moderate")
      ? "moderate"
      : "low";

  const signals = [
    ...(result.alerts || []),
    ...(result.reasons || []),
  ];

  return (
    <div className="result">
      <div className="riskBox">
        <div className={`riskIcon ${riskClass}`}>
          {riskClass === "high" ? <AlertTriangle /> : <ShieldCheck />}
        </div>

        <div>
          <span>
            {isReference
              ? "Transparent screening assessment"
              : "Transparent screening assessment"}
          </span>
          <strong>{risk}</strong>
        </div>

        <div className="score">
          <b>
            {result.score == null
              ? "—"
              : formatNumber(result.score)}
          </b>
          <small>
            {isReference
              ? "reference report · no prediction score"
              : "screen score · not probability"}
          </small>
        </div>
      </div>

      {isReference && (
        <div className="referenceNotice">
          <ShieldCheck size={18} />
          <div>
            <strong>Curated reference report</strong>
            <p>
              Source-linked background information for this example
              compound. This is not a new toxicity assay or a
              ToxiGuard-generated toxicity prediction.
            </p>
          </div>
        </div>
      )}

      {isPeptide ? (
        <div className="metricGrid">
          <Metric label="Sequence length" value={`${result.length ?? "—"} aa`} />
          <Metric label="Molecular weight" value={`${formatNumber(result.molecularWeight)} Da`} />
          <Metric label="Hydrophobicity" value={formatNumber(result.averageHydrophobicity)} />
          <Metric label="Net charge @ pH 7" value={formatNumber(result.netCharge, 2)} />
          <Metric label="Aromatic fraction" value={formatNumber(result.aromaticFraction)} />
          <Metric label="Cysteine fraction" value={formatNumber(result.cysteineFraction)} />
          <Metric label="Basic residues" value={result.basicCount ?? "—"} />
          <Metric label="Acidic residues" value={result.acidicCount ?? "—"} />
        </div>
      ) : (
        <div className="metricGrid">
          <Metric label="Molecular weight" value={`${formatNumber(result.molecularWeight)} Da`} />
          <Metric label="LogP" value={formatNumber(result.logP)} />
          <Metric label="TPSA" value={`${formatNumber(result.tpsa)} Å²`} />
          <Metric label="HBD / HBA" value={`${result.hBondDonors ?? 0} / ${result.hBondAcceptors ?? 0}`} />
          <Metric label="Rotatable bonds" value={result.rotatableBonds ?? "—"} />
          <Metric label="Ring count" value={result.ringCount ?? "—"} />
          <Metric label="Aromatic rings" value={result.aromaticRings ?? "—"} />
          <Metric label="Formal charge" value={result.formalCharge ?? 0} />
        </div>
      )}

      {!isPeptide && (
        <div className="resultSection">
          <h3>Structure identification</h3>

          <div className="safeLine">
            <CheckCircle2 size={17} />
            <span>
              <b>{result.identifierType || "SMILES"}:</b>{" "}
              {result.input || result.smiles}
            </span>
          </div>

          {result.pubchem && (
            <div className="resultMeta">
              PubChem CID: <b>{result.pubchem.cid}</b> · Formula:{" "}
              <b>{result.pubchem.formula || "—"}</b>
            </div>
          )}
        </div>
      )}

      <div className="resultSection">
        <h3>Structural / sequence signals</h3>

        {signals.length ? (
          <ul>
            {signals.map((signal, index) => (
              <li key={`${signal}-${index}`}>
                <AlertTriangle size={15} />
                {signal}
              </li>
            ))}
          </ul>
        ) : (
          <div className="safeLine">
            <CheckCircle2 size={17} />
            No major screening signals detected by the current rule set.
          </div>
        )}
      </div>

      <div className="resultSection">
        <h3>Endpoint model status</h3>

        <div className="endpointBox">
          <div>
            <span>Current engine</span>
            <b>{result.engine || "FastAPI + RDKit"}</b>
          </div>

          <div>
            <span>Validated toxicity ML</span>
            <b className="mutedValue">Not connected yet</b>
          </div>

          <p>
            Endpoint-specific toxicity models will be added only after a
            curated dataset, validation workflow and applicability-domain
            checks are in place.
          </p>
        </div>
      </div>

      {isReference && (
        <ReferenceReport report={result.referenceReport} />
      )}

      <div className="resultSection">
        <h3>{isPeptide ? "Sequence" : "Structure input"}</h3>
        <code className="smiles">
          {isPeptide ? result.sequence : result.input || result.smiles}
        </code>
      </div>
    </div>
  );
}

function ReferenceReport({ report }) {
  if (!report) return null;

  return (
    <div className="referenceReport" aria-label="Curated reference report details">
      <div className="referenceBadge">
        <BookOpen size={13} />
        Source-linked reference
      </div>

      <section className="referenceSection">
        <h3>
          <FlaskConical size={17} />
          Toxicity evidence and context
        </h3>

        <p>{report.toxicitySummary}</p>

        <p className="contextText">{report.severityContext}</p>
      </section>

      <section className="referenceSection">
        <h3>
          <Pill size={17} />
          Pharmaceutical relevance
        </h3>

        <p className="pharmaText">{report.pharmaceuticalRelevance}</p>
      </section>

      <section className="referenceSection">
        <h3>
          <ShieldAlert size={17} />
          Limitations
        </h3>

        <p className="limitationsText">{report.limitations}</p>

        <p className="interpretationBox">
          <Info size={15} />
          <span>
            <strong>Interpretation:</strong> This is curated,
            source-linked background information. It is not a new assay,
            a ToxiGuard-generated toxicity prediction, or an individual
            safety assessment.
          </span>
        </p>
      </section>

      <section className="referenceSection">
        <h3>
          <BookOpen size={17} />
          Sources and further reading
        </h3>

        {Array.isArray(report.sources) && report.sources.length > 0 ? (
          <div className="sourceList">
            {report.sources.map((source, index) => (
              <article
                className="sourceCard"
                key={`${source.url}-${index}`}
              >
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {source.title || source.url}
                  <span aria-hidden="true"> ↗</span>
                </a>

                {source.supports && (
                  <span>{source.supports}</span>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p>No source links are available in this reference record.</p>
        )}
      </section>
    </div>
  );
}

function BatchResultContent({ result }) {
  const successful = result.results.filter((item) => item.success);

  const flagged = successful.filter(
    (item) =>
      item.risk?.startsWith("Moderate") ||
      item.risk?.startsWith("Higher")
  );

  return (
    <div className="result">
      <div className="riskBox">
        <div className="riskIcon low">
          <ShieldCheck />
        </div>

        <div>
          <span>Batch screening</span>
          <strong>
            {result.count} record{result.count === 1 ? "" : "s"} analyzed
          </strong>
        </div>

        <div className="score">
          <b>{flagged.length}</b>
          <small>records needing review</small>
        </div>
      </div>

      <div className="metricGrid">
        <Metric label="Records" value={result.count} />
        <Metric label="Successful" value={successful.length} />
        <Metric label="Review signals" value={flagged.length} />
        <Metric label="Errors" value={result.count - successful.length} />
      </div>

      <div className="resultSection">
        <h3>Batch results</h3>

        <div className="batchTableWrap">
          <table className="batchTable">
            <thead>
              <tr>
                <th>#</th>
                <th>Input</th>
                <th>Result</th>
                <th>Score</th>
              </tr>
            </thead>

            <tbody>
              {result.results.map((item) => (
                <tr key={item.row}>
                  <td>{item.row}</td>
                  <td>{item.input || "—"}</td>
                  <td>{item.success ? item.risk : "Error"}</td>
                  <td>
                    {item.success
                      ? Number(item.score ?? 0).toFixed(2)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
