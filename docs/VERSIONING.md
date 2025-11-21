# Version Management & Deployment Guide

## Overview
This repository uses **semantic versioning** (MAJOR.MINOR.PATCH) and follows **conventional commits** for automatic version bumping.

## Version Format
- **MAJOR**: Breaking changes (e.g., `BREAKING CHANGE:`, `feat!:`, `fix!:`)
- **MINOR**: New features (e.g., `feat:`)
- **PATCH**: Bug fixes (e.g., `fix:`)

## Commit Message Format
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature → **minor** version bump
- `fix`: Bug fix → **patch** version bump
- `docs`: Documentation changes
- `chore`: Maintenance tasks
- `refactor`: Code refactoring
- `test`: Test changes
- `perf`: Performance improvements
- `BREAKING CHANGE`: Breaking change → **major** version bump

### Examples
```bash
# Patch bump (1.0.0 → 1.0.1)
git commit -m "fix: resolve token generation error"

# Minor bump (1.0.0 → 1.1.0)
git commit -m "feat: add rate limiting middleware"

# Major bump (1.0.0 → 2.0.0)
git commit -m "feat!: redesign API endpoints

BREAKING CHANGE: API endpoints now use /v2/ prefix"
```

## Deployment Process

### Automatic Deployment (via CI/CD)
1. Push to `main` branch triggers deployment
2. Version is automatically bumped based on commit messages
3. Changelog is generated
4. Docker image is built and tagged with version
5. Lambda function is updated
6. New Lambda version is published
7. Production alias is updated
8. Git tag and GitHub release are created

### Version Tagging
Each deployment creates:
- **Docker tags**: `<version>`, `<git-sha>`, `latest`
- **Lambda version**: Numbered version (1, 2, 3, ...)
- **Git tag**: `v<version>` (e.g., `v1.2.3`)
- **Lambda alias**: `production` → points to latest version

## Manual Version Management

### Bump Version Manually
```bash
# Auto-detect from commits
npm run version:bump

# Specific bump
npm run version:bump:major  # 1.0.0 → 2.0.0
npm run version:bump:minor  # 1.0.0 → 1.1.0
npm run version:bump:patch  # 1.0.0 → 1.0.1
```

### Generate Changelog
```bash
npm run changelog
```

## Rollback

### List Available Versions
```bash
npm run rollback
# or
./.github/scripts/rollback-lambda.sh
```

### Rollback to Specific Version
```bash
npm run rollback -- 5
# or
./.github/scripts/rollback-lambda.sh 5
```

### Via AWS CLI
```bash
# List versions
aws lambda list-versions-by-function \
  --function-name omeagle-vitap-backend

# Update production alias to previous version
aws lambda update-alias \
  --function-name omeagle-vitap-backend \
  --name production \
  --function-version 5
```

## Monitoring

### View Current Version
```bash
# From Lambda environment variable
aws lambda get-function-configuration \
  --function-name omeagle-vitap-backend \
  --query 'Environment.Variables.VERSION'

# From production alias
aws lambda get-alias \
  --function-name omeagle-vitap-backend \
  --name production
```

### View Deployment History
```bash
# List all versions
aws lambda list-versions-by-function \
  --function-name omeagle-vitap-backend

# View specific version
aws lambda get-function \
  --function-name omeagle-vitap-backend \
  --qualifier 5
```

## Version Files

- `VERSION`: Current version (e.g., `1.0.0`)
- `CHANGELOG.md`: Auto-generated changelog
- `package.json`: npm version (synced with VERSION)

## CI/CD Workflow

```
Push to main
    ↓
Lint → Test → Security → Build
    ↓
Bump Version (auto)
    ↓
Generate Changelog
    ↓
Build & Tag Docker Images
    ↓
Deploy to Lambda
    ↓
Publish Lambda Version
    ↓
Update Production Alias
    ↓
Create Git Tag & GitHub Release
```

## Environment Variables

The deployment adds a `VERSION` environment variable to Lambda:
```bash
curl https://your-function-url/health
# Response includes version information
```

## Best Practices

1. **Use Conventional Commits**: Ensures correct version bumping
2. **Test Before Merge**: All tests must pass before deployment
3. **Monitor Deployments**: Check CloudWatch logs after deployment
4. **Keep Versions**: Lambda keeps all published versions
5. **Use Aliases**: Always access production via `production` alias
6. **Document Breaking Changes**: Clearly describe in commit message

## Troubleshooting

### Deployment Failed
```bash
# Check workflow logs
gh run list --workflow=deploy-lambda.yml

# View specific run
gh run view <run-id>

# Rollback if needed
npm run rollback -- <previous-version>
```

### Version Mismatch
```bash
# Check current version
cat VERSION

# Check Lambda version
aws lambda get-function-configuration \
  --function-name omeagle-vitap-backend \
  --query 'Environment.Variables.VERSION'
```

### Force Version Update
```bash
# Manually update VERSION file
echo "1.2.3" > VERSION

# Commit and push
git add VERSION
git commit -m "chore: set version to 1.2.3 [skip ci]"
git push
```

## Release Notes

GitHub releases are automatically created with:
- Version tag (e.g., `v1.2.3`)
- Generated changelog
- Deployment artifacts
- Lambda version information

Access releases at: `https://github.com/rudra-sah00/omeagle-vitap-backend/releases`
