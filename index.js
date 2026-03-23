#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { version } = require("./package.json");

const TEMPLATE_REPO = "haya-inc/discovery-kit-template";
const TEMPLATE_URL = `https://github.com/${TEMPLATE_REPO}.git`;
const TEMPLATE_REF = "432afb302ba93bd8623dd457fa5b0585c6a3cfd1";
const DEFAULT_PROJECT_NAME = "discovery-kit-project";

function runGit(args, cwd) {
  execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function copyTemplate(targetDir) {
  console.log("Cloning template...");
  fs.mkdirSync(targetDir, { recursive: true });
  runGit(["init", "--quiet"], targetDir);
  runGit(["remote", "add", "origin", TEMPLATE_URL], targetDir);
  runGit(["fetch", "--depth", "1", "origin", TEMPLATE_REF], targetDir);
  runGit(["checkout", "--quiet", "--detach", "FETCH_HEAD"], targetDir);
  fs.rmSync(path.join(targetDir, ".git"), { recursive: true, force: true });
}

function formatError(error) {
  if (error && error.code === "ENOENT" && error.path === "git") {
    return "git is required but was not found in PATH.";
  }

  if (error && typeof error.stderr === "string" && error.stderr.trim()) {
    return error.stderr.trim();
  }

  if (error && typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  return "unknown error";
}

function quoteForShell(value) {
  if (process.platform === "win32") {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return `'${value.replaceAll("'", "'\\''")}'`;
}

function printHelp() {
  console.log("Usage:");
  console.log("  create-discovery-kit [project-name]");
  console.log("");
  console.log("Options:");
  console.log("  -h, --help     Show help");
  console.log("  -v, --version  Show version");
  console.log("");
  console.log("Notes:");
  console.log("  project-name must be a single directory name.");
}

function validateProjectName(projectName) {
  if (!projectName.trim()) {
    throw new Error("project name must not be empty.");
  }

  if (path.isAbsolute(projectName)) {
    throw new Error("project name must be a single directory name.");
  }

  if (projectName === "." || projectName === "..") {
    throw new Error("project name must not be '.' or '..'.");
  }

  if (projectName.includes("/") || projectName.includes("\\")) {
    throw new Error("project name must be a single directory name.");
  }

  if (projectName.startsWith("-")) {
    throw new Error(`unknown option: ${projectName}`);
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);

  if (args.length > 1) {
    throw new Error("expected at most one project name.");
  }

  const [targetArg] = args;

  if (!targetArg) {
    return { projectName: DEFAULT_PROJECT_NAME };
  }

  if (targetArg === "-h" || targetArg === "--help") {
    return { action: "help" };
  }

  if (targetArg === "-v" || targetArg === "--version") {
    return { action: "version" };
  }

  validateProjectName(targetArg);

  return { projectName: targetArg };
}

function removeGitkeep(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      removeGitkeep(fullPath);
    } else if (entry.isFile() && entry.name === ".gitkeep") {
      fs.unlinkSync(fullPath);
    }
  }
}

function main() {
  let projectName;

  try {
    const parsedArgs = parseArgs(process.argv);

    if (parsedArgs.action === "help") {
      printHelp();
      return;
    }

    if (parsedArgs.action === "version") {
      console.log(version);
      return;
    }

    projectName = parsedArgs.projectName;
  } catch (error) {
    console.error(`Error: ${formatError(error)}`);
    process.exit(1);
  }

  const cwd = process.cwd();
  const targetDir = path.resolve(cwd, projectName);

  if (fs.existsSync(targetDir)) {
    console.error(`Error: directory already exists: ${projectName}`);
    process.exit(1);
  }

  let currentStep = "clone template";

  try {
    copyTemplate(targetDir);
    currentStep = "remove .gitkeep files";
    removeGitkeep(targetDir);
  } catch (error) {
    fs.rmSync(targetDir, { recursive: true, force: true });
    console.error(`Error: failed to ${currentStep}`);
    console.error(formatError(error));
    process.exit(1);
  }

  console.log("");
  console.log("✔ Discovery kit created");
  console.log("");
  console.log("Next steps:");
  console.log(`  cd ${quoteForShell(projectName)}`);
  console.log("");
}

main();
