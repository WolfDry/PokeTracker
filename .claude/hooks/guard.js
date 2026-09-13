#!/usr/bin/env node
// Hook PreToolUse : bloque tout accès au .env (hors .env.example) et git commit / git stash.
// Reçoit le JSON du hook sur stdin, répond par une décision "deny" si la commande est interdite.

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const tool = input.tool_name || "";
  const ti = input.tool_input || {};
  const texts = [ti.command, ti.file_path, ti.path, ti.pattern, ti.notebook_path]
    .filter((v) => typeof v === "string");

  const reason = texts.map(check).find(Boolean);
  if (!reason) process.exit(0);

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `[guard] ${reason} (outil ${tool}). Règle projet : voir CLAUDE.md.`,
      },
    })
  );
  process.exit(0);
});

function check(text) {
  // Toute référence à un fichier .env, .env.local, .env.production, etc. — sauf .env.example
  const envRe = /(^|[\s"'`=:/\(,])\.env(\.[\w-]+)*(?=$|[\s"'`&|;>)<,*])/g;
  let m;
  while ((m = envRe.exec(text)) !== null) {
    const name = m[0].replace(/^[\s"'`=:/\(,]/, "");
    if (name !== ".env.example") return `accès interdit au fichier ${name}`;
  }
  // git commit / git stash, y compris avec options globales (git -c x=y commit) et enchaînements
  if (/\bgit\b(?:\s+-[^\s]+(?:\s+[^\s-][^\s]*)?)*\s+(commit|stash)\b/.test(text)) {
    return "git commit / git stash sont réservés à l'utilisateur";
  }
  return null;
}
