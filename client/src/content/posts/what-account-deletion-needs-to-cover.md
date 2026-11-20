title: What account deletion needs to cover
date: 2026-11-19
about: Galleo
cover: /img/posts/what-account-deletion-needs-to-cover-wide.webp
card: /img/posts/what-account-deletion-needs-to-cover-card.webp
summary: Following account deletion through ownership, active jobs, shared work, derived copies and recovery, using Galleo’s operator tooling as a starting point and distinguishing completed work from proposed safeguards.

A person closes their account in a collaborative product. Their sign-in identity should go, but some of the documents they created may belong to a team that still uses them. Their private conversations with an assistant have a different ownership rule again.

Galleo’s lifecycle code starts with an inventory and deletion plan. It distinguishes solo workspaces from shared ones, refuses some unsafe states and deletes related records in dependency order. The current flow is operator-assisted rather than a complete self-service deletion system.

That implementation is a useful starting point. This article describes what it does, then examines the additional coordination needed for external copies, active work and recovery. The additional safeguards are proposals; the current tooling does not resolve every retention question.

## Decide what belongs to the person

An account can have credentials, memberships, private conversations, visits and personal preferences. A workspace can have documents, comments, media and shared configuration. Deleting the account does not necessarily mean deleting every row the person helped create.

In Galleo’s current policy, a solo workspace can be removed with its owner’s account. An owned workspace containing other members blocks deletion until ownership is transferred. Work in another team’s workspace remains, with certain authorship references cleared. The person’s own assistant threads are removed across workspaces.

Those are product decisions that should be visible before deletion starts. A preview should explain which workspaces will be removed, which team content remains and what action is required to proceed.

Clearing an author ID is not complete anonymization. A document body, comment or uploaded file may still contain someone’s name or other personal information. The current code’s treatment of references should not be described as proving that all identifying content has disappeared.

![The inventory separates personal records, a solo workspace and shared team work. Each category follows an explicit ownership policy instead of one broad cascade.](figure:deletion-ownership)

## Check blockers before removing dependencies

Galleo’s deletion plan refuses an owned shared workspace, a relevant live subscription and open credit holds. The intent is to avoid removing team ownership, leaving billing active or deleting records that an active run still needs for settlement.

The database work uses a transaction for each workspace and another for the person’s records. A failure can therefore leave some workspaces deleted while later work remains. That is more specific than an all-or-nothing account-wide transaction, and the status report should reflect it.

Planning and applying also happen at different moments. A new member or job could appear between them unless the application coordinates that transition. We would add an explicit deletion state that blocks new work and revalidate the plan at the write boundary. The preliminary inventory alone should not be treated as a lock on future activity.

For an operator-assisted flow, that coordination needs to be clear in the runbook as well as the code. An operator should know whether the account is quiescent, which checks were repeated and whether the process can safely resume after interruption.

## Prevent delayed work from recreating data

An upload processor, export worker or indexing job may still carry a reference to a workspace after deletion begins. If it blindly writes its result later, it can recreate a derived copy or leave an orphaned object.

In a fuller design, we would mark the workspace as deleting, prevent new jobs and make workers check that lifecycle state before publishing results. A generation or deletion epoch can help reject work created before the cutoff, but it has to be compared at the point where the result becomes visible.

The worker may already have written an object before discovering the deletion state. That object needs a cleanup record even if no database row ultimately points to it. Deleting the row that would have described the object does not remove the object itself.

A durable deletion request can track the affected resources and completion of each cleanup step. Repeated attempts should find already-removed resources and continue. A missing object can count as complete; a provider timeout needs reconciliation rather than an assumption that removal succeeded.

![Deletion begins by blocking new work, then removes active and derived records, and finally verifies remaining cleanup. Delayed workers must respect the deletion boundary.](figure:deletion-workflow)

## Inventory copies outside the main tables

The review should include uploaded objects, thumbnails, generated exports, search chunks, embeddings, analytics records and diagnostic traces. Each copy needs an owner and a deletion mechanism.

Some derived content can be removed through a database cascade. Other copies live in a different service and require an API call or an operator action. Galleo’s lifecycle documentation explicitly identifies external systems and manual follow-up; the database deletion function should not be represented as handling all of them automatically.

We would keep a status per system: pending, confirmed, failed or retained under an explicit policy. “Account deleted” can describe the end of sign-in access, but a broader claim about all copies needs evidence from those separate steps.

The inventory itself must remain useful without becoming another permanent store of the content being removed. Resource identifiers, request identity and outcome codes are often sufficient. Full document bodies and credentials do not belong in the deletion audit record.

## Treat backups and restoration separately

A backup may contain data that has been removed from the active database. Its retention window and restoration procedure are separate from the active deletion transaction.

We would document the actual retention configuration rather than invent a duration in the interface. If a backup is restored, the recovery process needs a way to reapply deletion decisions before reopening the product to users or restarting workers that could republish old content.

That can require a deletion ledger maintained outside the restored snapshot, with appropriate access controls and retention of its own. The ledger should contain the minimum identity needed to prevent reintroduction. Its design needs to account for identifier reuse and restored external object references.

Restoration tests should include a deletion made after the backup point. A backup that restores successfully is not enough evidence if it also brings a closed account and its content back into service.

## Keep external retention claims narrow

A payment provider, analytics service or model provider may hold records under its own configuration and retention rules. Removing an application row does not establish what those systems retain.

We would distinguish records we can delete through an API, records requiring a separate request and records intentionally retained under a documented policy. The article does not prescribe the applicable legal retention period; that needs to be established for the business and jurisdiction.

The product’s communication should match the implemented process. If a step is manual, say so in the operational status. If a provider has acknowledged a request but not completed it, preserve that distinction. A timeout should not become a successful deletion simply to close the ticket.

## Test interruption and the retained work

A useful test creates a solo workspace and a shared workspace, then deletes the account. It checks that the solo content is removed, shared work remains under the intended ownership, the person’s private threads are gone and other members’ threads are untouched.

We would also pause deletion after one workspace, restart the process and verify that it resumes without deleting additional unintended resources. Separate tests should attempt new work after the cutoff, deliver a delayed worker result, fail an external cleanup call and restore an older backup.

The retained data deserves inspection too. Nulling an author reference should not break the document or expose another person’s private conversation through an export. Access-control tests should cover the state after the membership is gone.

The useful outcome is a deletion report that says what was removed, what remains and why, and what still needs follow-up. That gives the person and the operator a more reliable account than treating a single successful database operation as the end of the process.
