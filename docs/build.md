# Build Process Documentation

This document describes the build process for packages that depend on pdm.abstract.

## Prerequisites

- Git
- jq (JSON processor)
- Max/MSP 9 or later

## Overview

pdm.abstract provides shared infrastructure for Max/MSP packages, including:
- Common JavaScript utilities
- Shared abstractions
- Build system configuration

## Build Process

### 1. Initial Setup

```bash
# Clone the dependent repository (e.g., pdm.queue)
git clone <repository-url>
cd <repository-name>

# Initialize and update submodules
git submodule init
git submodule update
```

### 2. Dependency Configuration

Each package defines its dependencies in a `dependencies.json` file at the root level. This file specifies:
- JavaScript files to be copied from pdm.abstract
- Max patches to be bundled
- Import statement updates needed

Example configuration:
```json
{
    "javascript": [
        {
            "source": "dependencies/pdm.abstract/javascript/pdm.max.js",
            "destination": "javascript/dependencies/pdm.max.js"
        },
        {
            "source": "dependencies/pdm.abstract/javascript/pdm.maxjsobject.js",
            "destination": "javascript/dependencies/pdm.maxjsobject.js"
        }
    ],
    "abstractions": [
        {
            "source": "dependencies/pdm.abstract/abstractions/*.maxpat",
            "destination": "abstractions/dependencies/"
        }
    ],
    "import_updates": [
        {
            "search": "require('pdm.maxjsobject.js')",
            "replace": "require('./dependencies/pdm.maxjsobject.js')"
        }
    ]
}
```

### 3. Building the Package

To build the package and bundle all dependencies:

```bash
# Make the build script executable
chmod +x dependencies/pdm.abstract/scripts/bundle-dependencies.sh

# Run the build script
./dependencies/pdm.abstract/scripts/bundle-dependencies.sh
```

The build script will:
1. Create necessary directories
2. Copy JavaScript dependencies from pdm.abstract
3. Copy Max patch dependencies
4. Update import statements in JavaScript files

### 4. Release Process

To create a release:

```bash
# Make the release script executable
chmod +x dependencies/pdm.abstract/scripts/release.sh

# Run the release script
./dependencies/pdm.abstract/scripts/release.sh
```

The release process will:
1. Update version numbers in relevant files
2. Run the build script
3. Test the package thoroughly
4. Create a git tag for the release
5. Push the release to GitHub

## File Organization

- `dependencies.json`: Package-specific dependencies (excluded from release)
- `package-info.json`: Package metadata (included in release)
- `javascript/`: Package JavaScript files (included in release)
- `abstractions/`: Package abstractions (included in release)

## Troubleshooting

### Common Issues

1. **Missing jq**: If you see an error about jq not being installed:
   ```bash
   # On macOS
   brew install jq
   
   # On Linux
   sudo apt-get install jq
   ```

2. **Submodule Issues**: If the submodule isn't properly initialized:
   ```bash
   git submodule update --init --recursive
   ```

3. **Permission Issues**: If the scripts aren't executable:
   ```bash
   chmod +x dependencies/pdm.abstract/scripts/*.sh
   ```

## Maintenance

- Keep the `dependencies.json` file updated when adding new dependencies
- Test the build process after making changes to dependencies
- Update this documentation when the build process changes

## Notes

- This documentation is part of pdm.abstract and applies to all packages that use it as a dependency
- The build process is designed to be automated and repeatable
- All dependencies are bundled with the package for distribution
- Build configuration files (dependencies.json) are excluded from releases 