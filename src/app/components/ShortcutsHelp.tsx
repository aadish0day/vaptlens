import React from "react";
import * as V from "@/ui";

/* keyboard shortcuts overlay (?) */
export function ShortcutsHelp(p) {
  var rows = [
    ["1 – 9, 0", "Go to a view (Dashboard … Executive Report)"],
    ["/", "Search findings"],
    ["Ctrl / ⌘ + K", "Command palette: views, hosts, findings, actions"],
    ["?", "This help"],
    ["Esc", "Close the top dialog, drawer or menu"],
    ["↑ ↓ Home End", "Move inside an open menu"],
    ["Enter / Space", "Activate a chart bar or tile"],
    ["Alt + ← / →", "Back / forward through views, hosts and findings"],
  ];
  return (
    <V.Modal title="Keyboard shortcuts" width="520px" onClose={p.onClose}>
      <table className="ledger kbd-help">
        <tbody>
          {rows.map(function (r) {
            return (
              <tr key={r[0]}>
                <td>
                  <kbd>{r[0]}</kbd>
                </td>
                <td>{r[1]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </V.Modal>
  );
}
/* props that make a list row open the finding drawer (click, Enter or Space) */
