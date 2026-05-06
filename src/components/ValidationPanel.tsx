import type { FileValidationRecord } from '../types';

type ValidationPanelProps = {
  validFiles: FileValidationRecord[];
  excludedFiles: FileValidationRecord[];
};

export function ValidationPanel({ validFiles, excludedFiles }: ValidationPanelProps) {
  return (
    <section className="validation-grid">
      <div className="panel">
        <h2>Valid files</h2>
        <ul className="compact-list">
          {validFiles.map((file) => (
            <li key={file.fileName}>{file.fileName} · A1 {file.a1Date}</li>
          ))}
        </ul>
      </div>
      <div className="panel">
        <h2>Excluded files</h2>
        <ul className="compact-list">
          {excludedFiles.map((file) => (
            <li key={file.fileName}>{file.fileName} · {file.reason}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
