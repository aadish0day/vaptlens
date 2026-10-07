import React, { useState } from "react";
import * as V from "@/ui";

/* Reject with an optional reason the requester will see */
export function RejectButton(p) {
  var o = useState(false),
    r = useState("");
  if (!o[0])
    return (
      <button
        type="button"
        className="up-edit"
        onClick={function () {
          o[1](true);
        }}
      >
        Reject
      </button>
    );
  return (
    <form
      className="sv-form"
      onSubmit={function (e) {
        e.preventDefault();
        p.onReject(r[0].trim());
        o[1](false);
      }}
    >
      <input
        className="wb-select"
        autoFocus={true}
        value={r[0]}
        placeholder="Reason (shown to the requester)"
        aria-label="Rejection reason"
        onChange={function (e) {
          r[1](e.target.value);
        }}
      />
      <V.Button size="sm" variant="danger" type="submit">
        Reject
      </V.Button>
      <button
        type="button"
        className="up-edit"
        onClick={function () {
          o[1](false);
        }}
      >
        Cancel
      </button>
    </form>
  );
}
/* search that filters 250 ms after typing stops (20k-row tables stay responsive) */
