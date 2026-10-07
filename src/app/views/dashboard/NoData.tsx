import { PageHead } from "@/app/components/PageHead";
import { VIEWS } from "@/app/lib/common";
import React from "react";
import * as V from "@/ui";

export function NoData(ctx) {
  var v = VIEWS.find(function (x) {
    return x[0] === ctx.route;
  });
  return (
    <div className="page">
      <PageHead
        title={v ? v[1] : "Dashboard"}
        sub={
          (ctx.readOnly
            ? "No scan data has been loaded yet. An administrator or remediation lead uploads scans; "
            : "No scan data is loaded. Upload scans to start; ") +
          "this view fills in from them."
        }
      />
      <div className="nodata">
        <V.FileDropzone
          onBrowse={ctx.openUpload}
          onFiles={function (files) {
            ctx.openUpload(files);
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
