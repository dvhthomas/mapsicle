# Static Analysis Setup

This project uses `svelte-check` to catch errors before runtime.

## What It Catches

The static analyzer will detect:

- **Undefined variables and functions** in Svelte templates (the main benefit!)
- **Type mismatches** in component props
- **Accessibility issues** (a11y warnings)
- **Invalid Svelte syntax**

### Example

If you accidentally write:
```svelte
<Map on:boundschange={handleBoundsChange} />
```

But the function is actually named `handleMapBoundsChange`, the checker will warn:
```
Error: 'handleBoundsChange' is not defined
```

This catches typos and refactoring mistakes before they cause runtime errors.

## Usage

### Run Once

Check the entire codebase:

```bash
npm run check
```

### Watch Mode

Continuously check as you edit:

```bash
npm run check:watch
```

### Automatic Build Integration

**Static analysis runs automatically on every build!**

```bash
npm run build
```

The build process will:
1. Run `svelte-check` first (via `prebuild` script)
2. **Fail the build if any warnings or errors are found**
3. Only proceed to `vite build` if the code is clean

This prevents deploying broken code to production.

### Manual Checks

You can also run checks manually:

```bash
# Check once
npm run check

# Check continuously as you edit
npm run check:watch
```

### IDE Integration

Most editors can use the `jsconfig.json` to provide inline warnings:

- **VS Code**: Install the official "Svelte for VS Code" extension
- **IntelliJ/WebStorm**: Svelte support is built-in
- **Vim/Neovim**: Use the `svelte-language-server`

## Configuration

The static analysis configuration is intentionally **relaxed** to avoid overwhelming a JavaScript codebase with strict TypeScript-style errors.

### Files

- **`jsconfig.json`**: Controls JavaScript/TypeScript type checking behavior
- **`svelte.config.js`**: Svelte compiler configuration (already existed)

### What's NOT Checked

To keep the tool practical for a JavaScript project, we've disabled:

- Strict null checks
- Implicit any warnings
- Full TypeScript type requirements

You get the benefits (catching undefined variables) without the overhead (annotating every type).

## Upgrading to TypeScript (Optional)

If you ever want stricter type checking, you can:

1. Rename `jsconfig.json` to `tsconfig.json`
2. Enable stricter compiler options
3. Gradually rename `.js` files to `.ts` and `.svelte` components to add type annotations

The current setup is designed to work well with pure JavaScript while still catching common bugs.

## Summary

**Key Benefits:**

✅ **Catches undefined variables/functions** before runtime
✅ **Blocks broken builds** automatically
✅ **No TypeScript overhead** - works with pure JavaScript
✅ **Fast feedback** - runs in ~2 seconds
✅ **CI/CD ready** - fails builds in deployment pipelines

**Example:** If you accidentally write `on:click={handleClik}` instead of `on:click={handleClick}`, the build will fail with a clear error message instead of silently deploying broken code.
