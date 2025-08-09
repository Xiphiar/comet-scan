import { FC, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import { SingleCodePageResponse, SingleContractPageResponse } from "@comet-scan/types";
import { getSingleCodePage, getSingleContractPage } from "../../api/pagesApi";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { toast } from "react-fox-toast";
import { unzipSync } from "fflate";
import CodeViewer from "../../components/CodeViewer/CodeViewer";

type FileNode = {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: FileNode[];
  size?: number;
  content?: string; // decoded text preview
};

function buildTreeFromZip(zipMap: Record<string, Uint8Array>): FileNode {
  const root: FileNode = { name: "", path: "", type: "dir", children: [] };
  const getOrCreateDir = (dirPath: string[]): FileNode => {
    let node = root;
    for (const part of dirPath) {
      if (!part) continue;
      if (!node.children) node.children = [];
      let child = node.children.find((c) => c.type === "dir" && c.name === part);
      if (!child) {
        child = { name: part, path: (node.path ? node.path + "/" : "") + part, type: "dir", children: [] };
        node.children.push(child);
      }
      node = child;
    }
    return node;
  };

  Object.entries(zipMap).forEach(([filePath, data]) => {
    const parts = filePath.split("/").filter(Boolean);
    const fileName = parts.pop();
    const dir = getOrCreateDir(parts);
    if (!dir.children) dir.children = [];
    if (fileName) {
      dir.children.push({
        name: fileName,
        path: (dir.path ? dir.path + "/" : "") + fileName,
        type: "file",
        size: data?.byteLength || 0,
      });
    }
  });

  // sort: dirs first then files, alpha
  const sortTree = (node: FileNode) => {
    if (!node.children) return;
    node.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortTree);
  };
  sortTree(root);
  return root;
}

const CodeBrowserPage: FC = () => {
  const { chain: chainLookupId, codeId, contractAddress } = useParams();
  const { getChain } = useConfig();
  const chain = getChain(chainLookupId);

  const fromCodeId = Boolean(codeId);
  const title = "Source Browser";

  const codeReq = useAsync<SingleCodePageResponse | undefined>(
    //@ts-expect-error idc
    fromCodeId && chain ? getSingleCodePage(chain.chainId, codeId!) : async () => undefined
  );
  const contractReq = useAsync<SingleContractPageResponse | undefined>(
    //@ts-expect-error idc
    !fromCodeId && chain ? getSingleContractPage(chain.chainId, contractAddress!) : async () => undefined
  );

  const verification = (codeReq.data as SingleCodePageResponse | undefined)?.verification
    || (contractReq.data as SingleContractPageResponse | undefined)?.verification;

  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({});
  const [selectedPath, setSelectedPath] = useState<string | undefined>();

  const zipMap: Record<string, Uint8Array> | undefined = useMemo(() => {
    try {
      if (!verification?.code_zip) return undefined;
      const binary = atob(verification.code_zip);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const files = unzipSync(bytes) as Record<string, Uint8Array>;
      return files;
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to read source ZIP: ${err.toString()}`);
      return undefined;
    }
  }, [verification?.code_zip]);

  const tree = useMemo(() => (zipMap ? buildTreeFromZip(zipMap) : undefined), [zipMap]);

  const contentText = useMemo(() => {
    if (!zipMap || !selectedPath) return undefined;
    const data = zipMap[selectedPath];
    if (!data) return undefined;
    // Try decode as UTF-8, else show placeholder
    try {
      const decoder = new TextDecoder("utf-8", { fatal: false });
      return decoder.decode(data);
    } catch {
      return undefined;
    }
  }, [zipMap, selectedPath]);

  if (!chain) {
    return (
      <div>
        <h1>Chain Not Found</h1>
      </div>
    );
  }

  if ((fromCodeId && !codeReq.data) || (!fromCodeId && !contractReq.data)) {
    return <ContentLoading chain={chain} title={title} error={codeReq.error || contractReq.error} />;
  }

  const Header = (
    <div className="d-flex align-items-center justify-content-between">
      <div className="d-flex align-items-center gap-3">
        <Link to={`/${chainLookupId}/codes/${fromCodeId ? codeId : (contractReq.data as SingleContractPageResponse).contract.codeId}`}>Code</Link>
        <span>/</span>
        {fromCodeId ? (
          <span>Code {codeId}</span>
        ) : (
          <Link to={`/${chainLookupId}/contracts/${contractAddress}`}>{contractAddress}</Link>
        )}
      </div>
      <div>
        {verification?.builder && <span className="text-muted">Built with: {verification.builder}</span>}
      </div>
    </div>
  );

  const toggleExpand = (path: string) => {
    setExpandedPaths((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const renderTree = (node: FileNode) => {
    if (!node.children) return null;
    return node.children.map((child) => (
      <div key={child.path} className="d-flex flex-column">
        {child.type === "dir" ? (
          <div className="d-flex align-items-center" style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleExpand(child.path)}>
            <span style={{ width: 16, display: "inline-block" }}>{expandedPaths[child.path] ? "▾" : "▸"}</span>
            <span>{child.name}</span>
          </div>
        ) : (
          <div className="d-flex align-items-center" style={{ cursor: "pointer" }} onClick={() => setSelectedPath(child.path)}>
            <span style={{ width: 16, display: "inline-block" }} />
            <span className={selectedPath === child.path ? "font-weight-bold" : undefined}>{child.name}</span>
          </div>
        )}
        {child.type === "dir" && expandedPaths[child.path] && (
          <div style={{ paddingLeft: 16 }}>{renderTree(child)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="d-flex flex-column">
      <TitleAndSearch chain={chain} title={title} />
      <Card>
        {Header}
        <div style={{ borderBottom: '1px solid var(--light-gray)', paddingTop: '8px' }} />
        {!verification?.code_zip ? (
          <div className="py-4 w-full text-center">No verified source is available.</div>
        ) : (
          <div className="d-flex" style={{ height: "70vh", gap: 16 }}>
            <div className="col-4" style={{ overflow: "auto", borderRight: '1px solid var(--light-gray)', paddingRight: 8 }}>
              {tree ? renderTree(tree) : <div className="py-4 w-full text-center">Loading...</div>}
            </div>
            <div className="col" style={{ overflow: "auto" }}>
              {!selectedPath ? (
                <div className="py-4 w-full text-center">Select a file to preview.</div>
              ) : (
                <>
                  <div className="d-flex align-items-center justify-content-between" style={{ borderBottom: '1px solid var(--light-gray)', paddingBottom: 8, marginBottom: 8 }}>
                    <div className="d-flex align-items-center gap-2">
                      <strong>{selectedPath}</strong>
                      {zipMap?.[selectedPath] && (
                        <span className="text-muted">{zipMap[selectedPath].byteLength.toLocaleString()} bytes</span>
                      )}
                    </div>
                    {zipMap?.[selectedPath] && (
                      <button
                        type="button"
                        className="buttonLink"
                        onClick={() => {
                          try {
                            const blob = new Blob([zipMap[selectedPath]], { type: 'application/octet-stream' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = selectedPath.split('/').pop() || 'file';
                            a.click();
                            URL.revokeObjectURL(url);
                          } catch (err: any) {
                            toast.error(`Failed to download file: ${err.toString()}`);
                          }
                        }}
                      >
                        Download file
                      </button>
                    )}
                  </div>
                  {!contentText ? (
                    <div className="py-4 w-full text-center">Binary or unsupported preview. Use "Download file" to save.</div>
                  ) : (
                    <CodeViewer filePath={selectedPath} code={contentText} />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CodeBrowserPage;


