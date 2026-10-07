import React from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

function size(b) { return b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB"; }
/* ---------- FileUploadList (per-file status: queued/uploading/done/error, retry & remove) ---------- */
/* files: [{ id, name, size, status, progress?, error?, detail? }] */
export function FileUploadList(props) {
  return (
    <ul className="vl-files" aria-label={props.label || "Files"}>
      {(props.files || []).map(function (f) {
        var st = f.status || "queued";
        return (
          <li key={f.id || f.name} className={cx("vl-file", "is-" + st)}>
            <Icon name={st === "error" ? "x-circle" : st === "done" ? "check-circle" : "file"} size={16} />
            <div className="vl-file-main">
              <div className="vl-file-top"><span className="vl-file-name" title={f.name}>{f.name}</span><span className="vl-file-size">{f.size != null ? size(f.size) : ""}</span></div>
              {st === "uploading" ? <div className="vl-progress-track" role="progressbar" aria-label={"Uploading " + f.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={f.progress || 0}><span className="vl-progress-fill" style={{ width: (f.progress || 0) + "%" }} /></div> : null}
              <div className="vl-file-sub" role={st === "error" ? "alert" : undefined}>{st === "error" ? f.error || "Upload failed" : st === "done" ? f.detail || "Done" : st === "uploading" ? (f.progress || 0) + "%" : "Waiting"}</div>
            </div>
            {st === "error" && props.onRetry ? <button type="button" className="vl-ibtn is-sm is-ghost" aria-label={"Retry " + f.name} title="Retry" onClick={function () { props.onRetry(f); }}><Icon name="rotate-cw" size={14} /></button> : null}
            {props.onRemove ? <button type="button" className="vl-ibtn is-sm is-ghost" aria-label={"Remove " + f.name} title="Remove" onClick={function () { props.onRemove(f); }}><Icon name="x" size={14} /></button> : null}
          </li>
        );
      })}
    </ul>
  );
}
