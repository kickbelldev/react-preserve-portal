# Publishing to npm

The `Publish npm package` workflow builds and tests the source already merged
into `main`, packs once, and verifies ESM/CommonJS runtime and declaration
exports in six React consumers. A separate job downloads that exact artifact,
checks its source and SHA-512 integrity, and publishes using GitHub OIDC. The
publication job installs no project dependencies and receives no npm token.
Official actions are pinned to immutable commits; release builds do not use caches.

## One-time npm configuration

A package maintainer must configure **Trusted Publisher → GitHub Actions** on
[@charley-kim/react-preserve-portal's settings](https://www.npmjs.com/package/@charley-kim/react-preserve-portal/access).
This cannot be established by committing a workflow alone.

| npm field | Value |
| --- | --- |
| Organization or user | `kickbelldev` |
| Repository | `react-preserve-portal` |
| Workflow filename | `npm-publish.yml` |
| Environment name | Leave empty |
| Allowed actions | Enable direct **`npm publish`** |

The workflow does not need permission to manage dist-tags independently. New
connections default to staged publishing in npm's current UI, so explicitly
allow direct publication. Configure the connection when ready to release: npm
expires new configurations without a successful first publication within two
days. Do not create a long-lived npm token, commit credentials, or change account
2FA/security settings for this workflow. Existing authentication settings do not
need to change. See the [official npm instructions](https://docs.npmjs.com/trusted-publishers/).
Node 24 supplies a supported npm CLI (npm 11.5.1+ is required).

## Prepare and rehearse

1. Create a PR updating the package version, CHANGELOG, and bilingual release
   documentation. Keep the library's public guarantees and compatibility accurate.
2. Pass CI, including the React/browser matrix, then merge into `main`.
3. Run `gh workflow run npm-publish.yml --ref main` and inspect both jobs. Manual
   dispatch **always performs a dry run**; it cannot publish, even for a new
   version. This checks the build, artifact transfer, package contents, source,
   and consumer installs. It does **not** prove npm trusts the workflow.
   If the version already exists, npm's publish dry run is skipped because npm
   rejects existing versions even with `--dry-run`; all artifact checks still run.
4. Check the registry before creating the release tag:

   ```bash
   npm view @charley-kim/react-preserve-portal version dist-tags --json
   ```

   Do not reuse an existing version or move `latest` backwards. Confirm the npm
   trusted publisher is configured before triggering the first publication.

## Publish and verify

From the reviewed, merged release commit, create and push `vX.Y.Z`. The tag must
exactly match `packages/react-preserve-portal/package.json`; only stable versions
are supported. Tag pushes are the only event that can publish.

```bash
git tag vX.Y.Z REVIEWED_MERGE_COMMIT
git push origin vX.Y.Z
```

The workflow verifies the npm registry version, exports, SHA-512, SHA-1 and the
bytes downloaded from the published tarball. It records the source commit and
current `latest` in its summary and `registry-confirmation` artifact. After
success, install the registry tarball with `scripts/verify-package.mjs` against
React 18 and 19, check the deployed docs, then create GitHub release notes for
that tag. A successful build, dry run, or tag alone is not a completed release.

## Interrupted or failed runs

Inspect the registry **before** retrying publication. The script also does this
before publishing and after a failed CLI response. An identical existing version
is verified and skipped without changing dist-tags; differing bytes fail. An
absent version older than `latest` fails. The script never automatically retries
`npm publish`. If a registry request itself fails, the result remains uncertain
until registry access recovers.

For an absent version, fix the specific failure, then rerun the failed workflow
job. Authentication errors usually mean the npm connection does not match the
repository/workflow or does not allow direct `npm publish`. Do not work around
these errors by adding a token or changing security policy. A changed source or
artifact requires a new reviewed version/tag; do not rewrite a published tag.
