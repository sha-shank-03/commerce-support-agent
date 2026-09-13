# Publication licence and asset review

Reviewed 13 September 2026 for source publication and the static portfolio demo. This is an engineering inventory, not a legal opinion or a grant of rights in the original project.

- [Locked dependency inventory](dependency-licenses.json): 71 installed Python distributions, 405 npm lock entries (including development tools and optional platforms), and 16 resolved Go modules. Python/npm entries all declare licence metadata; resolved Go modules include their upstream notices.
- Browser runtime dependency licence/copyright texts are retained in [third-party-notices.txt](../web/public/third-party-notices.txt), which is also deployed with the static frontend. No package source or licence was modified.
- Dependencies include permissive licences, Python licensing and MPL-2.0 for certifi's distribution. Review each upstream notice before redistributing modified libraries or binaries; dependency licences do not apply to the original application code.
- The repository contains original synthetic tickets, orders and demonstration policies, actual replay metadata, and unmodified screenshots of this application's UI. No employer code, private customer data, real carrier account or third-party product artwork is included.
- There is no public backend container image or vendored node_modules/.venv distribution in this release. Docker files install pinned upstream packages with their own notices.
- No permissive source licence was added. Original code and fixtures remain copyright Shashank under [NOTICE.md](../NOTICE.md).
