# Content Moderation and Listings

<cite>
**Referenced Files in This Document**
- [AdminListingsTab.tsx](file://src/components/admin/AdminListingsTab.tsx)
- [AdminDisputesTab.tsx](file://src/components/admin/AdminDisputesTab.tsx)
- [AdminReportsTab.tsx](file://src/components/admin/AdminReportsTab.tsx)
- [AdminTypes.ts](file://src/components/admin/AdminTypes.ts)
- [ReportView.tsx](file://src/components/ReportView.tsx)
- [DisputeView.tsx](file://src/components/DisputeView.tsx)
- [DisputesListView.tsx](file://src/components/DisputesListView.tsx)
- [ListingForm.tsx](file://src/components/listing/ListingForm.tsx)
- [categories.ts](file://src/data/categories.ts)
- [reports.ts](file://src/data/reports.ts)
- [disputes.ts](file://src/data/disputes.ts)
- [banned-phrases.ts](file://src/lib/banned-phrases.ts)
- [admin actions.ts](file://src/services/admin/actions.ts)
- [mockAdminService.ts](file://src/services/admin/mockAdminService.ts)
- [supabase.ts](file://src/services/backend/supabase.ts)
- [mappers.ts](file://src/services/backend/mappers.ts)
- [202607150003_phase_3_listing_media.sql](file://supabase/migrations/202607150003_phase_3_listing_media.sql)
- [202608190001_fix_profile_recursion_and_avatar_storage.sql](file://supabase/migrations/202608190001_fix_profile_recursion_and_avatar_storage.sql)
</cite>

## Table of Contents
1. Introduction
2. Project Structure
3. Core Components
4. Architecture Overview
5. Detailed Component Analysis
6. Dependency Analysis
7. Performance Considerations
8. Troubleshooting Guide
9. Conclusion

## Introduction
This document explains the content moderation tools and listing management features available to administrators and users. It covers the listing approval workflow, content review processes, automated moderation signals, dispute resolution mechanisms, report handling, policy enforcement tools, listing status management, category organization, and content filtering capabilities. It also provides guidance for handling user reports, takedown requests, appeals, quality standards enforcement, spam detection, community guidelines monitoring, and escalation procedures.

## Project Structure
The moderation and listings functionality spans UI components, data models, services, and database migrations:
- Admin UI tabs for listings, disputes, and reports
- User-facing reporting and dispute interfaces
- Listing creation and editing forms
- Data fixtures for categories, reports, and disputes
- Policy and safety utilities (e.g., banned phrases)
- Admin action service and mock implementations
- Backend integration via Supabase and mappers
- Database schema and storage-related migrations

```mermaid
graph TB
subgraph "Admin UI"
A["AdminListingsTab"]
B["AdminDisputesTab"]
C["AdminReportsTab"]
end
subgraph "User UI"
D["ReportView"]
E["DisputeView"]
F["DisputesListView"]
end
subgraph "Listing Tools"
G["ListingForm"]
H["Categories"]
end
subgraph "Policy & Safety"
I["Banned Phrases"]
end
subgraph "Services"
J["Admin Actions"]
K["Mock Admin Service"]
L["Supabase Client"]
M["Mappers"]
end
subgraph "Data"
N["Reports Fixtures"]
O["Disputes Fixtures"]
end
A --> J
B --> J
C --> J
D --> J
E --> J
F --> J
G --> H
G --> I
J --> L
J --> M
C --> N
B --> O
```

**Diagram sources**
- [AdminListingsTab.tsx](file://src/components/admin/AdminListingsTab.tsx)
- [AdminDisputesTab.tsx](file://src/components/admin/AdminDisputesTab.tsx)
- [AdminReportsTab.tsx](file://src/components/admin/AdminReportsTab.tsx)
- [ReportView.tsx](file://src/components/ReportView.tsx)
- [DisputeView.tsx](file://src/components/DisputeView.tsx)
- [DisputesListView.tsx](file://src/components/DisputesListView.tsx)
- [ListingForm.tsx](file://src/components/listing/ListingForm.tsx)
- [categories.ts](file://src/data/categories.ts)
- [banned-phrases.ts](file://src/lib/banned-phrases.ts)
- [admin actions.ts](file://src/services/admin/actions.ts)
- [mockAdminService.ts](file://src/services/admin/mockAdminService.ts)
- [supabase.ts](file://src/services/backend/supabase.ts)
- [mappers.ts](file://src/services/backend/mappers.ts)
- [reports.ts](file://src/data/reports.ts)
- [disputes.ts](file://src/data/disputes.ts)

**Section sources**
- [AdminListingsTab.tsx](file://src/components/admin/AdminListingsTab.tsx)
- [AdminDisputesTab.tsx](file://src/components/admin/AdminDisputesTab.tsx)
- [AdminReportsTab.tsx](file://src/components/admin/AdminReportsTab.tsx)
- [ReportView.tsx](file://src/components/ReportView.tsx)
- [DisputeView.tsx](file://src/components/DisputeView.tsx)
- [DisputesListView.tsx](file://src/components/DisputesListView.tsx)
- [ListingForm.tsx](file://src/components/listing/ListingForm.tsx)
- [categories.ts](file://src/data/categories.ts)
- [banned-phrases.ts](file://src/lib/banned-phrases.ts)
- [admin actions.ts](file://src/services/admin/actions.ts)
- [mockAdminService.ts](file://src/services/admin/mockAdminService.ts)
- [supabase.ts](file://src/services/backend/supabase.ts)
- [mappers.ts](file://src/services/backend/mappers.ts)
- [reports.ts](file://src/data/reports.ts)
- [disputes.ts](file://src/data/disputes.ts)

## Core Components
- Admin List tab: Provides moderation actions on listings such as approve, reject, hide, or flag for review. Supports filtering by status and category.
- Admin Disputes tab: Displays active disputes, allows admins to review evidence, communicate with parties, and resolve outcomes (e.g., refund, restore listing).
- Admin Reports tab: Shows user-submitted reports, their severity, and related entities (listings, users), enabling triage and action.
- Report view: Enables users to submit reports against listings or users with context and optional attachments.
- Dispute views: Allow buyers/sellers to open disputes, upload evidence, and track resolution progress.
- Listing form: Guides sellers through listing creation with category selection and media upload; integrates with policy checks where applicable.
- Categories: Centralized category definitions used across listing creation and discovery.
- Banned phrases: Safety utility that flags potentially prohibited content in text fields.
- Admin actions service: Encapsulates backend calls for moderation operations (approve/reject/report/dispute resolution).
- Mock admin service: Local implementation for development/testing without live backend.
- Supabase client and mappers: Persist and transform moderation state and listing metadata.

**Section sources**
- [AdminListingsTab.tsx](file://src/components/admin/AdminListingsTab.tsx)
- [AdminDisputesTab.tsx](file://src/components/admin/AdminDisputesTab.tsx)
- [AdminReportsTab.tsx](file://src/components/admin/AdminReportsTab.tsx)
- [ReportView.tsx](file://src/components/ReportView.tsx)
- [DisputeView.tsx](file://src/components/DisputeView.tsx)
- [DisputesListView.tsx](file://src/components/DisputesListView.tsx)
- [ListingForm.tsx](file://src/components/listing/ListingForm.tsx)
- [categories.ts](file://src/data/categories.ts)
- [banned-phrases.ts](file://src/lib/banned-phrases.ts)
- [admin actions.ts](file://src/services/admin/actions.ts)
- [mockAdminService.ts](file://src/services/admin/mockAdminService.ts)
- [supabase.ts](file://src/services/backend/supabase.ts)
- [mappers.ts](file://src/services/backend/mappers.ts)

## Architecture Overview
Moderation flows connect user actions, admin workflows, and backend persistence:

```mermaid
sequenceDiagram
participant User as "User"
participant UI as "ReportView / DisputeView"
participant AdminUI as "AdminTabs"
participant Svc as "Admin Actions"
participant DB as "Supabase"
participant Map as "Mappers"
User->>UI : Submit report or open dispute
UI->>Svc : Create report/dispute payload
Svc->>DB : Insert record
DB-->>Svc : Confirmation
Svc-->>UI : Success + IDs
AdminUI->>Svc : Fetch reports/disputes
Svc->>DB : Query records
DB-->>Svc : Records
Svc->>Map : Transform to UI types
Map-->>AdminUI : Rendered list
AdminUI->>Svc : Approve/Reject/Resolve
Svc->>DB : Update status + audit log
DB-->>Svc : Updated record
Svc-->>AdminUI : Refreshed state
```

**Diagram sources**
- [ReportView.tsx](file://src/components/ReportView.tsx)
- [DisputeView.tsx](file://src/components/DisputeView.tsx)
- [AdminReportsTab.tsx](file://src/components/admin/AdminReportsTab.tsx)
- [AdminDisputesTab.tsx](file://src/components/admin/AdminDisputesTab.tsx)
- [admin actions.ts](file://src/services/admin/actions.ts)
- [supabase.ts](file://src/services/backend/supabase.ts)
- [mappers.ts](file://src/services/backend/mappers.ts)

## Detailed Component Analysis

### Listing Approval Workflow
- Creation: Sellers create listings via a guided form with category selection and media uploads.
- Initial state: New listings enter a pending state awaiting review.
- Review: Admins inspect listing details, images, and metadata from the admin listings tab.
- Decision: Admins can approve (publish), reject (hide), or request changes.
- Feedback: Users are notified of decisions and can edit and resubmit if needed.

```mermaid
flowchart TD
Start(["Create Listing"]) --> Draft["Draft Saved"]
Draft --> Submit["Submit for Review"]
Submit --> Pending{"Pending Review"}
Pending --> |Auto-checks| Flagged{"Flagged?"}
Flagged --> |Yes| Hold["Hold for Manual Review"]
Flagged --> |No| Queue["Review Queue"]
Hold --> Queue
Queue --> Decide{"Admin Decision"}
Decide --> |Approve| Published["Published"]
Decide --> |Reject| Rejected["Rejected"]
Decide --> |Request Changes| Revision["Revision Required"]
Revision --> Submit
Published --> End(["Live"])
Rejected --> End
```

**Diagram sources**
- [ListingForm.tsx](file://src/components/listing/ListingForm.tsx)
- [AdminListingsTab.tsx](file://src/components/admin/AdminListingsTab.tsx)
- [banned-phrases.ts](file://src/lib/banned-phrases.ts)
- [admin actions.ts](file://src/services/admin/actions.ts)

**Section sources**
- [ListingForm.tsx](file://src/components/listing/ListingForm.tsx)
- [AdminListingsTab.tsx](file://src/components/admin/AdminListingsTab.tsx)
- [banned-phrases.ts](file://src/lib/banned-phrases.ts)
- [admin actions.ts](file://src/services/admin/actions.ts)

### Content Review Processes
- Automated signals: Text fields are scanned against banned phrases to surface potential violations.
- Media review: Listing media is stored and accessible for inspection; storage configuration ensures consistent access.
- Triage: Admin reports tab aggregates flagged items and user submissions for prioritization.
- Auditability: Actions are recorded to support accountability and future audits.

```mermaid
flowchart TD
Ingest["New Listing / Report"] --> Scan["Scan Text for Policy Violations"]
Scan --> Score{"Risk Score"}
Score --> |High| Escalate["Escalate to Senior Moderator"]
Score --> |Medium| Queue["Queue for Review"]
Score --> |Low| AutoApprove["Auto-Approve or Monitor"]
Queue --> Review["Human Review"]
Escalate --> Review
Review --> Action{"Action"}
Action --> Publish["Publish"]
Action --> Remove["Remove / Hide"]
Action --> RequestEdit["Request Edits"]
```

**Diagram sources**
- [banned-phrases.ts](file://src/lib/banned-phrases.ts)
- [AdminReportsTab.tsx](file://src/components/admin/AdminReportsTab.tsx)
- [202607150003_phase_3_listing_media.sql](file://supabase/migrations/202607150003_phase_3_listing_media.sql)

**Section sources**
- [banned-phrases.ts](file://src/lib/banned-phrases.ts)
- [AdminReportsTab.tsx](file://src/components/admin/AdminReportsTab.tsx)
- [202607150003_phase_3_listing_media.sql](file://supabase/migrations/202607150003_phase_3_listing_media.sql)

### Automated Moderation Systems
- Text scanning: Uses predefined phrase lists to detect policy-sensitive content in titles, descriptions, and messages.
- Heuristics: Combines keyword matches with frequency thresholds to reduce false positives.
- Integration: Flags are surfaced in admin queues and can influence auto-decisions based on configured policies.

```mermaid
flowchart TD
Input["Text Input"] --> Split["Tokenize / Normalize"]
Split --> Match["Match Against Banned Phrases"]
Match --> Count["Count Occurrences"]
Count --> Threshold{"Exceeds Threshold?"}
Threshold --> |Yes| Flag["Flag for Review"]
Threshold --> |No| Clear["Clear"]
```

**Diagram sources**
- [banned-phrases.ts](file://src/lib/banned-phrases.ts)

**Section sources**
- [banned-phrases.ts](file://src/lib/banned-phrases.ts)

### Dispute Resolution Mechanisms
- Opening disputes: Users can initiate disputes with context and evidence.
- Evidence collection: Both parties can upload supporting materials.
- Resolution: Admins review evidence, mediate, and issue resolutions (refund, reinstatement, etc.).
- Tracking: Status updates and history are visible to involved parties.

```mermaid
sequenceDiagram
participant Buyer as "Buyer"
participant Seller as "Seller"
participant UI as "DisputeView"
participant Svc as "Admin Actions"
participant DB as "Supabase"
Buyer->>UI : Open dispute + attach evidence
UI->>Svc : Create dispute
Svc->>DB : Persist dispute + evidence
DB-->>Svc : Dispute ID
Svc-->>UI : Show status
Seller->>UI : Add response/evidence
UI->>Svc : Update dispute
Svc->>DB : Append evidence
Admin->>Svc : Resolve dispute
Svc->>DB : Set outcome + notify
DB-->>Svc : Acknowledged
Svc-->>UI : Finalized
```

**Diagram sources**
- [DisputeView.tsx](file://src/components/DisputeView.tsx)
- [DisputesListView.tsx](file://src/components/DisputesListView.tsx)
- [admin actions.ts](file://src/services/admin/actions.ts)
- [supabase.ts](file://src/services/backend/supabase.ts)

**Section sources**
- [DisputeView.tsx](file://src/components/DisputeView.tsx)
- [DisputesListView.tsx](file://src/components/DisputesListView.tsx)
- [admin actions.ts](file://src/services/admin/actions.ts)
- [supabase.ts](file://src/services/backend/supabase.ts)

### Report Handling and Policy Enforcement
- Reporting: Users can report listings or users with reasons and context.
- Triage: Admins prioritize reports by severity and impact.
- Enforcement: Actions include warnings, removals, temporary restrictions, or permanent bans depending on policy.
- Appeals: Users may appeal decisions through defined channels; admins review and adjust outcomes when warranted.

```mermaid
flowchart TD
Rpt["User Report"] --> Triage["Triage by Severity"]
Triage --> Investigate["Investigate Context"]
Investigate --> Decide{"Policy Violation?"}
Decide --> |Yes| Enforce["Enforce Action"]
Decide --> |No| Close["Close as Not Applicable"]
Enforce --> Notify["Notify Parties"]
Notify --> Appeal{"Appeal?"}
Appeal --> |Yes| Review["Re-review"]
Appeal --> |No| Finalize["Finalize"]
Review --> Adjust{"Adjust Outcome?"}
Adjust --> |Yes| Enforce
Adjust --> |No| Finalize
```

**Diagram sources**
- [ReportView.tsx](file://src/components/ReportView.tsx)
- [AdminReportsTab.tsx](file://src/components/admin/AdminReportsTab.tsx)
- [admin actions.ts](file://src/services/admin/actions.ts)

**Section sources**
- [ReportView.tsx](file://src/components/ReportView.tsx)
- [AdminReportsTab.tsx](file://src/components/admin/AdminReportsTab.tsx)
- [admin actions.ts](file://src/services/admin/actions.ts)

### Listing Status Management and Category Organization
- Status lifecycle: Draft → Pending → Approved/Rejected → Live/Hidden.
- Category taxonomy: Centralized categories guide listing classification and discovery filters.
- Filtering: Admins and users can filter listings by status, category, and other attributes.

```mermaid
stateDiagram-v2
[*] --> Draft
Draft --> Pending : "Submit"
Pending --> Approved : "Admin Approve"
Pending --> Rejected : "Admin Reject"
Approved --> Live : "Publish"
Live --> Hidden : "Hide / Takedown"
Rejected --> Revision : "Request Edits"
Revision --> Pending : "Resubmit"
Hidden --> Pending : "Restore"
```

**Diagram sources**
- [AdminListingsTab.tsx](file://src/components/admin/AdminListingsTab.tsx)
- [categories.ts](file://src/data/categories.ts)

**Section sources**
- [AdminListingsTab.tsx](file://src/components/admin/AdminListingsTab.tsx)
- [categories.ts](file://src/data/categories.ts)

### Content Filtering Capabilities
- Keyword-based filtering: Leverages banned phrase lists to detect and flag problematic content.
- Field-level checks: Applied to titles, descriptions, and chat/message content where relevant.
- Admin visibility: Flagged content appears in moderation queues for human review.

**Section sources**
- [banned-phrases.ts](file://src/lib/banned-phrases.ts)
- [AdminReportsTab.tsx](file://src/components/admin/AdminReportsTab.tsx)

### Handling User Reports, Takedown Requests, and Appeals
- User reports: Submitted via dedicated view with context and attachments.
- Takedown requests: Processed similarly to reports; expedited for severe violations.
- Appeals: Admins re-evaluate prior decisions and update status accordingly.

**Section sources**
- [ReportView.tsx](file://src/components/ReportView.tsx)
- [AdminReportsTab.tsx](file://src/components/admin/AdminReportsTab.tsx)
- [admin actions.ts](file://src/services/admin/actions.ts)

### Quality Standards Enforcement, Spam Detection, and Community Guidelines Monitoring
- Quality checks: Validate completeness and accuracy of listing information.
- Spam detection: Combine keyword heuristics with behavioral signals (frequency, patterns).
- Guidelines monitoring: Continuous scanning and periodic audits ensure adherence to community standards.

**Section sources**
- [banned-phrases.ts](file://src/lib/banned-phrases.ts)
- [AdminReportsTab.tsx](file://src/components/admin/AdminReportsTab.tsx)

### Workflows for Common Moderation Scenarios and Escalation Procedures
- High-severity violation: Immediate removal, notify affected parties, log incident, escalate to senior moderator.
- Low-severity infraction: Warning issued, monitor for recurrence, educate user.
- Repeat offenders: Progressive discipline culminating in account restrictions or bans.
- Escalation path: Frontline moderators → Senior moderators → Trust & Safety leads.

[No sources needed since this section provides general procedural guidance]

## Dependency Analysis
Moderation features depend on UI components, services, and data layers:

```mermaid
graph LR
UI_Admin["Admin Tabs"] --> Svc["Admin Actions"]
UI_User["Report / Dispute Views"] --> Svc
Svc --> DB["Supabase"]
Svc --> Map["Mappers"]
UI_Listing["Listing Form"] --> Cat["Categories"]
UI_Listing --> Safety["Banned Phrases"]
DB --> Mig["Media Migration"]
```

**Diagram sources**
- [AdminListingsTab.tsx](file://src/components/admin/AdminListingsTab.tsx)
- [AdminDisputesTab.tsx](file://src/components/admin/AdminDisputesTab.tsx)
- [AdminReportsTab.tsx](file://src/components/admin/AdminReportsTab.tsx)
- [ReportView.tsx](file://src/components/ReportView.tsx)
- [DisputeView.tsx](file://src/components/DisputeView.tsx)
- [ListingForm.tsx](file://src/components/listing/ListingForm.tsx)
- [admin actions.ts](file://src/services/admin/actions.ts)
- [supabase.ts](file://src/services/backend/supabase.ts)
- [mappers.ts](file://src/services/backend/mappers.ts)
- [categories.ts](file://src/data/categories.ts)
- [banned-phrases.ts](file://src/lib/banned-phrases.ts)
- [202607150003_phase_3_listing_media.sql](file://supabase/migrations/202607150003_phase_3_listing_media.sql)

**Section sources**
- [admin actions.ts](file://src/services/admin/actions.ts)
- [supabase.ts](file://src/services/backend/supabase.ts)
- [mappers.ts](file://src/services/backend/mappers.ts)
- [categories.ts](file://src/data/categories.ts)
- [banned-phrases.ts](file://src/lib/banned-phrases.ts)
- [202607150003_phase_3_listing_media.sql](file://supabase/migrations/202607150003_phase_3_listing_media.sql)

## Performance Considerations
- Batch operations: Group multiple moderation actions to reduce network overhead.
- Pagination and filtering: Efficiently load large sets of listings, reports, and disputes.
- Caching: Cache static category lists and policy rules to minimize repeated fetches.
- Image handling: Optimize media loading and avoid unnecessary re-renders during reviews.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Missing media: If listing images do not appear, verify storage configuration and migration steps for media folders.
- Permission errors: Ensure proper roles and grants for accessing moderation tables and storage buckets.
- Stale data: Refresh admin views after backend updates; clear local caches if necessary.
- Mapping issues: Confirm that mappers align with current schema versions.

**Section sources**
- [202608190001_fix_profile_recursion_and_avatar_storage.sql](file://supabase/migrations/202608190001_fix_profile_recursion_and_avatar_storage.sql)
- [202607150003_phase_3_listing_media.sql](file://supabase/migrations/202607150003_phase_3_listing_media.sql)
- [supabase.ts](file://src/services/backend/supabase.ts)
- [mappers.ts](file://src/services/backend/mappers.ts)

## Conclusion
The moderation and listings system combines user-driven reporting, structured admin workflows, and automated safeguards to maintain marketplace integrity. By leveraging categorized listings, robust dispute resolution, and policy enforcement tools, administrators can efficiently manage content quality and community standards while providing transparent processes for users.

[No sources needed since this section summarizes without analyzing specific files]