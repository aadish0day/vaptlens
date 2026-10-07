import { PageHead } from "@/app/components/PageHead";
import React from "react";
import * as V from "@/ui";

export function NoData(ctx) {
  return (
    <div className="page">
      <PageHead
        title="Dashboard"
        sub="No scan data is loaded. Upload scans to start."
      />
      <div className="nodata">
        <V.FileDropzone
          onBrowse={ctx.openUpload}
          onFiles={function () {
            ctx.openUpload();
          }}
        />
        <div className="row-wrap">
          <V.Button variant="primary" icon="upload" onClick={ctx.openUpload}>
            Upload scans
          </V.Button>
        </div>
      </div>
    </div>
  );
}
