# Wix member roles and staff onboarding

## Wix Studio

In **Site Member Access**, create a Club member role and a general Staff member role. Create one staff role per non-restricted **access role** in the table below. The job code identifies the position in SuccessFactors. The access role attached to that job assignment determines the Wix page role.

Copy the native role IDs from Role Settings. In Wix Secrets Manager, set `SKANDI_WIX_STAFF_ROLE_IDS` to a JSON object with `SKANDI_STAFF` and each access-role code as keys and their existing Wix member role IDs as values. Use a different ID for each role and keep the Club role outside this mapping.

| Access role code | Access preset |
| --- | --- |
| `DCS_AGENT` | `dcs` |
| `DESTINATION_CONTROLLER` | `destination-control` |
| `DISPATCHER` | `destination-control` |
| `FIELD_STAFF` | `read-only` |
| `GUIDE` | `read-only` |
| `HR_ADMIN` | `hr-admin` |
| `HR_MANAGER` | `hr-manager` |
| `INVENTORY_ADMIN` | `inventory-admin` |
| `OCC_CONTROLLER` | `altea` |
| `READ_ONLY` | `read-only` |
| `SALES_AGENT` | `sales` |
| `UNIFORM_MANAGER` | `uniform-manager` |

Owner and system administrator grants use the separate Identity & Access approval process. Before setting the page restrictions, grant approved roles to existing staff and the Club role to existing Club members. Verify that Club enrollment assigns the Club role for future signups before gating `/my-profile`.

In **Studio → Pages → Settings → Permissions → Members only → Specific members → Members with roles**, set the route access below. Wix permits any selected role to open a page. Select only specialist roles on a specialist page. Source-level checks for compiled staff tools use the existing application catalog and backend session.

| Page | Role to select |
| --- | --- |
| Club landing, Club login, Careers and RIA INTRA sign-in | Public entry pages |
| My Profile, including My Trips | Club |
| SuccessFactors and shared employee pages | Staff |
| ALTEA Reservations | Sales and authorized OCC roles |
| ALTEA OPS Control | Authorized OCC roles |
| Inventory Control | Inventory Admin and approved administrators |
| Payroll administration | Approved payroll roles only |
| Media, policy, uniform, and store administration | The approved roles for each tool |

Use `src/public/siteMap.js` to confirm the published route and controller for each editor page. Publish the Wix settings together with the verified source. A separate receiver installation is needed only if the page still uses an older receiver.

## Complete a hire

1. Mark the candidate Hired. Create the employee in SuccessFactors using the correct corporate Wix login and save their organization assignment. Reuse an existing work account if already provisioned.
2. In **Recruiting → Onboarding**, select that candidate and complete each applicable task. The existing task status editor also supports cancellation for tasks that do not apply.
3. Choose **Complete onboarding** and enter the hire’s employee SK-ID. The backend checks the candidate link, employee identity and current assignment. It grants the Staff and assigned access roles, then activates the employee. An incomplete Wix grant keeps the employee in onboarding and can be retried.
4. Test direct page access with a Club member, a new staff member, a staff role without access, and a deactivated member. Verify the data permissions for each staff action separately from opening its page.

The public application uses its existing Careers portal. A candidate with an existing Wix work member link must use that same member ID. A legacy candidate without a Wix ID can be linked by HR to the employee’s verified corporate Wix member during completion. A member pending Wix approval still follows the site’s approval policy.

The existing deactivation workflow removes the Wix roles recorded by this completion action. For later job changes, reconcile the native Wix roles as part of the staff access change. Current backend permissions follow the effective SuccessFactors assignment.
