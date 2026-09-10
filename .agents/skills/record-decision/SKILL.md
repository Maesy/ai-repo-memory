---
name: record-decision
description: "Record a lasting requirement, product decision or architecture decision in the repository when one is agreed or proposed, preserving rationale and approval status."
---

# Record a decision

Read [routing](../../../docs/knowledge/README.md) and [lifecycle rules](../../../docs/knowledge/governance.md). Search existing records before writing.

Route observable requirements to a PRD, product choices to a PDR and technical choices to an ADR. Use [the templates](../../../docs/templates/) only when a new record is warranted. Add directories only with real content. Do not turn each small code edit into a decision record.

Capture context, the actual alternatives, the choice, rationale and consequences. Unapproved content stays proposed. Record a reviewer, date and approval reference only from actual authorization; approval belongs to the reviewed version. Keep the currently applicable requirement while a successor is proposed.

For a changed accepted decision, create a successor and link the records. Update the navigational index with the source. Coordinate one writer for the change; preserve unrelated work. Follow validate-knowledge by reading its canonical file if needed, not by assuming a validator exists.

Report the files, IDs, versions and remaining uncertainties. Do not commit, publish externally or modify another checkout without authorization.
