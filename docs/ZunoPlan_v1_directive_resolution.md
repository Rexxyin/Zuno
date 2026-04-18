# ZunoPlan Comprehensive Directive — Implementation Log

Date: 2026-04-18

Legend: **DONE** = fully implemented in this pass, **PARTIAL** = partially addressed with scoped limitations, **SKIPPED** = not implemented.

| # | Item | Status | Justification / Resolution |
|---|---|---|---|
|1.1|Invite-only plans excluded from feed|DONE|`/api/plans` now filters at query level with `.eq('visibility','public')` and feed also only renders public plans.|
|1.2|Status as single source of truth|PARTIAL|Introduced normalized statuses (`open/closed/full/expired`) and effective-status derivation in `src/lib/plan.ts`; feed/detail use these. Full database enum migration from legacy values remains partially backward-mapped.|
|1.3|WhatsApp link gated to participants|DONE|Plan detail renders WhatsApp link only for host or joined participant.|
|2.1|Role detection|DONE|Added `isHost`, `isParticipant`, `isVisitor` in detail client and used for rendering branches.|
|2.2|Description placement below title|DONE|Detail hero order now title → description → chips row.|
|2.3|Spots count = joiners only|DONE|Joined count uses joined participants only, host excluded.|
|2.4|Host management buttons on detail page|DONE|Added host controls: edit, manage requests, close, delete, confirm final amount.|
|2.5|Visitor join flow (all 4 cases)|PARTIAL|Implemented open/closed state handling, approval pending flow, invite-only join from direct page. Some backend legacy semantics (`approval_mode`/`visibility` coercion) still mapped for compatibility.|
|2.6|Joined participant view|DONE|Added joined chip, WhatsApp button, payment section, leave action with confirm.|
|2.7|Instagram link tappable|DONE|Host Instagram icon links to fetched `plan.host.instagram_url`.|
|2.8|Expired plan visibility rules|PARTIAL|Feed excludes expired; direct visitor access to expired plan blocked with ended state. My Plans styling differentiation for expired-hosted cards is only partially visualized via card badges/status mapping.|
|3.1|Cost fields simplified to toggle + 1 input|DONE|Create flow now has `cost_mode` + `cost_amount`; removed three legacy inputs from UI.|
|3.2|Cost display on plan detail|DONE|Added split estimate card with per-person/total display and info hint text.|
|3.3|UPI intent pay + settle buttons|DONE|Added UPI deep link construction with `pa/pn/am/cu/tn` and mark-settled action.|
|3.4|Settle status board|DONE|Added “Who’s settled” board for host/participants.|
|3.5|Payee name in profile|DONE|Added profile payee name field and storage key `upi_payee_name`.|
|4.1|Spot count defaults to 0|DONE|Create step defaults `max_people` to 0 with helper text and min 0.|
|4.2|Conditional join-mode options by plan type|DONE|Invite-only hides join-mode controls and shows helper note; public shows segmented control.|
|4.3|Step 4 publish preview summary|DONE|Review step now shows multi-row summary card with conditional rows.|
|4.4|Date/time input styled|DONE|Wrapped datetime input in styled container matching app input treatment.|
|5.0|Edit plan form all fields|DONE|Expanded `/plans/[id]/edit` form to include create-flow fields and save back to detail route.|
|6.1|Hosted tab query fix|DONE|Hosted list now based only on `host_id===currentUser.id` and no city filtering.|
|6.2|Upcoming tab query fix|DONE|Upcoming now ignores city and checks join + future + non-expired/deleted effective status.|
|6.3|Past tab query fix|DONE|Past now includes joined plans where datetime passed or status expired, no city filter.|
|6.4|Pending request badge|PARTIAL|Badge on My Plans tab icon via `BottomNav` prop + hosted pending count implemented in My Plans route context; global app-wide pending badge fetch not yet centralized.|
|7.0|Login dialog centered + styled|DONE|Overlay fixed+centered, 400px max/90vw, overlay-click dismiss, branded header + Google icon/button label.|
|8.1|Duplicate city selector removed|DONE|Removed duplicate city pill from feed header section.|
|8.2|Status badges on feed cards|DONE|PlanCard maps non-open statuses to standardized badges.|
|8.3|Spots scarcity on feed cards|DONE|Added scarcity text for <=3 spots and last spot handling.|
|8.4|Avatar stack on feed cards|DONE|Added overlapping avatar stack, fallback initials, deterministic hash color, empty state text.|
|9.1|Payee name in profile|DONE|Implemented (same as 3.5).|
|9.2|Email display in profile settings|DONE|Added read-only email field in own-profile edit form.|
|9.3|Google photo auto-populated on login|DONE|Auth callback now seeds `avatar_url` from OAuth metadata.|
|9.4|Profile via avatar popover|DONE|Top-right avatar popover now shows user info, edit profile, logout; bottom nav remains Discover/My Plans/FAB.|
|10.1|Status badge visual language standardized|PARTIAL|Centralized badge mapping in `src/lib/plan.ts`; applied in feed/detail. My Plans-specific muted card treatment for expired-hosted plans is partial.|
|10.2|Skeleton loaders replace loading text|PARTIAL|Implemented skeleton card component + shimmer and applied to feed/my-plans; some routes (e.g., edit page plain loading text) still pending full replacement.|
|10.3|Destructive confirmation dialogs|DONE|Close/delete/leave prompts added to detail interactions.|
|11.1|Public plan page for unauthenticated users|DONE|Plan route renders for unauth users (except restricted invite-only/expired non-participant cases).|
|11.2|OG meta tags on plan pages|DONE|Metadata generation now uses plan-driven OG/Twitter values including `/api/og?planId=` URL.|
|11.3|OG image API route|DONE|Added `src/app/api/og/route.tsx` with 1200x630 dynamic image.|
|12.1|Participant count excludes host|DONE|Count logic uses participants only across feed/detail updates.|
|12.2|Women-only badge + restriction|PARTIAL|Badge added on feed/detail; backend join route blocks non-female users. Some client-side source-of-truth gender fallback paths remain limited when user gender is unset.|
|12.3|Join request accepted state update|PARTIAL|State refresh on join/detail reload implemented; no realtime subscription yet.|
|12.4|Require approval consolidated|DONE|Create flow removed separate checkbox semantics and uses segmented control to set `requireApproval`.|
|12.5|City matching case-insensitive|DONE|Feed comparison uses normalized city keys; API excludes null city from feed results.|
|12.6|Hosted tab not city-filtered|DONE|Hosted query no longer city constrained.|

## Notes
- A database migration was added for `cost_mode`, `cost_amount`, `final_amount`, `upi_payee_name`, and visibility check extension.
- Legacy schema compatibility is preserved where possible through mapping/fallbacks.
