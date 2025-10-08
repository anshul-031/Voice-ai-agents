# GitHub Copilot Command Approval Configuration

## Auto-Approved Commands (Safe Commands)
These commands are automatically approved without requiring user confirmation:

### Testing Commands
- `npm test` - Run all tests
- `npm test -- *` - Run tests with any Jest parameters
- `npm run test` - Run all tests (alternative)
- `npm run test:*` - Run specific test suites
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage
- `npm run test:ci` - Run tests in CI mode

### Build and Development Commands
- `npm run build` - Build the application
- `npm run dev` - Start development server
- `npm run start` - Start production server
- `npm run preview` - Preview production build

### Code Quality Commands
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

### Package Management Commands
- `npm install` - Install dependencies
- `npm ci` - Clean install from package-lock.json
- `npm audit` - Check for security vulnerabilities
- `npm audit fix` - Fix security vulnerabilities
- `npm outdated` - Check for outdated packages

### Git Commands (Read-only)
- `git status` - Check repository status
- `git log --oneline` - View commit history
- `git diff` - View changes
- `git branch` - List branches
- `git log --graph --oneline --all` - View branch history
- `git show` - Show commit details
- `git ls-files` - List tracked files

### File System Commands (Read-only)
- `ls` / `ls -la` - List directory contents
- `pwd` - Show current directory
- `cat filename` - Display file contents
- `head filename` - Show first lines of file
- `tail filename` - Show last lines of file
- `grep pattern filename` - Search in files
- `find . -name "pattern"` - Find files by name
- `wc -l filename` - Count lines in file

### Environment and System Info
- `node --version` - Check Node.js version
- `npm --version` - Check npm version
- `which node` - Find Node.js path
- `which npm` - Find npm path
- `echo $*` - Display environment variables
- `env | grep *` - Show filtered environment variables

## Commands Requiring Manual Approval
These commands always require explicit user confirmation:

### Destructive Operations
- `rm -rf *` - Delete files/directories
- `git reset --hard *` - Reset git history
- `git push --force *` - Force push to repository
- `sudo *` - Run as administrator
- `chmod *` - Change file permissions
- `chown *` - Change file ownership

### Deployment Commands
- `npm run deploy*` - Deploy to production
- `vercel --prod*` - Deploy to Vercel production
- Any cloud deployment commands

### File System Operations
- `mv * /*` - Move files to system directories
- `cp * /*` - Copy files to system directories
- Commands that modify files outside the project directory

## Usage Instructions

1. **Automatic Approval**: Commands in the auto-approved list will execute without prompting
2. **Manual Approval**: Other commands will show a confirmation dialog
3. **Learning Mode**: When approving a new command, Copilot will ask if you want to add it to the auto-approval list
4. **Safety Override**: Dangerous commands always require manual approval regardless of settings

## Configuration Files

- `.vscode/settings.json` - VS Code workspace settings
- `.github/copilot-instructions.md` - Copilot behavior instructions
- This file serves as documentation and reference

## Customization

To add more auto-approved commands, update the `chat.tools.terminal.autoApprove` section in `.vscode/settings.json`:

```json
"chat.tools.terminal.autoApprove": {
  "your-safe-command": true,
  "another-safe-command *": true
}
```

To add commands that should never be auto-approved, add them to `dangerousCommands` list.
