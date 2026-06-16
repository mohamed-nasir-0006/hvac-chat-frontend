import { useState, useEffect, useRef } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

interface DocumentInfo {
  source_id: string;
  title: string;
  category: string;
}

export default function Admin() {
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [fileCategory, setFileCategory] = useState("general");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual ingest state
  const [sourceId, setSourceId] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [textCategory, setTextCategory] = useState("general");
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState("");

  // Documents list state
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Load documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // =========================
  // Fetch all documents
  // =========================
  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`${BASE_URL}/documents`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      console.error("Failed to fetch documents");
    } finally {
      setLoadingDocs(false);
    }
  };

  // =========================
  // File Upload
  // =========================
  const handleFileUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadResult("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", fileCategory);

    try {
      const res = await fetch(`${BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.status === "success") {
        setUploadResult(`✅ Uploaded "${data.original_filename}" — ${data.chunks_added} chunk(s) added`);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchDocuments(); // Refresh list
      } else {
        setUploadResult(`❌ ${data.message}`);
      }
    } catch {
      setUploadResult("❌ Upload failed. Is the backend running?");
    } finally {
      setUploading(false);
    }
  };

  // =========================
  // Drag & Drop handlers
  // =========================
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  // =========================
  // Manual Text Ingest
  // =========================
  const handleIngest = async () => {
    if (!sourceId || !title || !text) return;
    setIngesting(true);
    setIngestResult("");

    try {
      const res = await fetch(`${BASE_URL}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_id: sourceId,
          title: title,
          text: text,
          category: textCategory,
        }),
      });
      const data = await res.json();

      if (data.status === "success") {
        setIngestResult(`✅ Ingested "${data.title}" — ${data.chunks_added} chunk(s) added`);
        setSourceId("");
        setTitle("");
        setText("");
        fetchDocuments(); // Refresh list
      } else {
        setIngestResult(`❌ ${data.message || "Ingest failed"}`);
      }
    } catch {
      setIngestResult("❌ Ingest failed. Is the backend running?");
    } finally {
      setIngesting(false);
    }
  };

  // =========================
  // Delete document
  // =========================
  const handleDelete = async (sid: string) => {
    if (!confirm(`Delete "${sid}" and all its chunks?`)) return;

    try {
      const res = await fetch(`${BASE_URL}/documents/${sid}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.status === "deleted") {
        fetchDocuments(); // Refresh list
      }
    } catch {
      console.error("Delete failed");
    }
  };

  // =========================
  // Render
  // =========================
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>📚 Knowledge Base Admin</h1>

      {/* ===== FILE UPLOAD SECTION ===== */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📁 Upload File</h2>
        <p style={styles.subtitle}>Supports PDF, TXT, DOCX</p>

        {/* Drag & Drop Zone */}
        <div
          style={{
            ...styles.dropZone,
            ...(dragActive ? styles.dropZoneActive : {}),
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.docx"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {file ? (
            <p>📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
          ) : (
            <p>Drag & drop a file here, or click to select</p>
          )}
        </div>

        {/* Category Select */}
        <div style={styles.row}>
          <label style={styles.label}>Category:</label>
          <select
            value={fileCategory}
            onChange={(e) => setFileCategory(e.target.value)}
            style={styles.select}
          >
            <option value="general">General</option>
            <option value="maintenance">Maintenance</option>
            <option value="energy_saving">Energy Saving</option>
            <option value="system_design">System Design</option>
            <option value="troubleshooting">Troubleshooting</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        <button
          onClick={handleFileUpload}
          disabled={!file || uploading}
          style={{
            ...styles.button,
            ...((!file || uploading) ? styles.buttonDisabled : {}),
          }}
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>

        {uploadResult && <p style={styles.result}>{uploadResult}</p>}
      </div>

      {/* ===== MANUAL INGEST SECTION ===== */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>✍️ Manual Text Ingest</h2>
        <p style={styles.subtitle}>Paste content directly</p>

        <input
          type="text"
          placeholder="Source ID (e.g., hvac-filter-001)"
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Title (e.g., HVAC Air Filters)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.input}
        />
        <textarea
          placeholder="Paste document content here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          style={styles.textarea}
        />

        <div style={styles.row}>
          <label style={styles.label}>Category:</label>
          <select
            value={textCategory}
            onChange={(e) => setTextCategory(e.target.value)}
            style={styles.select}
          >
            <option value="general">General</option>
            <option value="maintenance">Maintenance</option>
            <option value="energy_saving">Energy Saving</option>
            <option value="system_design">System Design</option>
            <option value="troubleshooting">Troubleshooting</option>
          </select>
        </div>

        <button
          onClick={handleIngest}
          disabled={!sourceId || !title || !text || ingesting}
          style={{
            ...styles.button,
            ...((!sourceId || !title || !text || ingesting) ? styles.buttonDisabled : {}),
          }}
        >
          {ingesting ? "Ingesting..." : "Ingest Document"}
        </button>

        {ingestResult && <p style={styles.result}>{ingestResult}</p>}
      </div>

      {/* ===== DOCUMENTS LIST SECTION ===== */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          📋 Documents in Knowledge Base
          <button onClick={fetchDocuments} style={styles.refreshBtn}>
            🔄 Refresh
          </button>
        </h2>

        {loadingDocs ? (
          <p>Loading...</p>
        ) : documents.length === 0 ? (
          <p style={styles.empty}>No documents found.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Source ID</th>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.source_id}>
                  <td style={styles.td}>{doc.source_id}</td>
                  <td style={styles.td}>{doc.title}</td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{doc.category}</span>
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleDelete(doc.source_id)}
                      style={styles.deleteBtn}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// =========================
// Styles
// =========================
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "2rem",
    fontFamily: "'Segoe UI', sans-serif",
    color: "#e0e0e0",
    minHeight: "100vh",
    backgroundColor: "#1a1a2e",
  },
  heading: {
    textAlign: "center",
    fontSize: "1.8rem",
    marginBottom: "2rem",
    color: "#ffffff",
  },
  section: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: "1.5rem",
    marginBottom: "1.5rem",
    border: "1px solid #0f3460",
  },
  sectionTitle: {
    fontSize: "1.2rem",
    marginBottom: "0.5rem",
    color: "#e94560",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subtitle: {
    fontSize: "0.85rem",
    color: "#888",
    marginBottom: "1rem",
  },
  dropZone: {
    border: "2px dashed #0f3460",
    borderRadius: 8,
    padding: "2rem",
    textAlign: "center",
    cursor: "pointer",
    marginBottom: "1rem",
    transition: "all 0.3s",
    color: "#888",
  },
  dropZoneActive: {
    borderColor: "#e94560",
    backgroundColor: "rgba(233, 69, 96, 0.1)",
    color: "#e94560",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  label: {
    fontSize: "0.9rem",
    color: "#aaa",
  },
  select: {
    padding: "0.4rem 0.8rem",
    borderRadius: 6,
    border: "1px solid #0f3460",
    backgroundColor: "#1a1a2e",
    color: "#e0e0e0",
    fontSize: "0.9rem",
  },
  input: {
    width: "100%",
    padding: "0.6rem",
    borderRadius: 6,
    border: "1px solid #0f3460",
    backgroundColor: "#1a1a2e",
    color: "#e0e0e0",
    fontSize: "0.9rem",
    marginBottom: "0.8rem",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "0.6rem",
    borderRadius: 6,
    border: "1px solid #0f3460",
    backgroundColor: "#1a1a2e",
    color: "#e0e0e0",
    fontSize: "0.9rem",
    marginBottom: "0.8rem",
    resize: "vertical",
    boxSizing: "border-box",
  },
  button: {
    padding: "0.6rem 1.5rem",
    borderRadius: 8,
    border: "none",
    backgroundColor: "#e94560",
    color: "#fff",
    fontSize: "0.95rem",
    cursor: "pointer",
    fontWeight: 600,
  },
  buttonDisabled: {
    backgroundColor: "#555",
    cursor: "not-allowed",
  },
  result: {
    marginTop: "0.8rem",
    fontSize: "0.9rem",
    padding: "0.5rem",
    borderRadius: 6,
    backgroundColor: "#1a1a2e",
  },
  refreshBtn: {
    background: "none",
    border: "1px solid #0f3460",
    color: "#e0e0e0",
    padding: "0.3rem 0.8rem",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "0.5rem",
  },
  th: {
    textAlign: "left",
    padding: "0.6rem",
    borderBottom: "1px solid #0f3460",
    color: "#e94560",
    fontSize: "0.85rem",
  },
  td: {
    padding: "0.6rem",
    borderBottom: "1px solid #0f3460",
    fontSize: "0.85rem",
  },
  badge: {
    backgroundColor: "#0f3460",
    padding: "0.2rem 0.6rem",
    borderRadius: 12,
    fontSize: "0.75rem",
    color: "#e0e0e0",
  },
  deleteBtn: {
    background: "none",
    border: "1px solid #e94560",
    color: "#e94560",
    padding: "0.2rem 0.6rem",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  empty: {
    textAlign: "center",
    color: "#666",
    padding: "1rem",
  },
};