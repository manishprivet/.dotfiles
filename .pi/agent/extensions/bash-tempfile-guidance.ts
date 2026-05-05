import os from "node:os";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

function buildBashTempfileGuidance(tempDir: string): string {
	const mktempExample = `tmpfile=$(mktemp "${tempDir}/pi-XXXXXX"); command > "$tmpfile"; next-command "$tmpfile"`;
	return `

Bash workflow preference:
- Prefer direct read-only bash commands when a single command is enough and the captured bash output can be inspected directly or with the read tool afterward.
- Only use a temporary file in ${tempDir} when you expect follow-up shell inspection or reuse of the same output across multiple bash commands.
- Good tempfile cases: find/rg/git/ls output that will be consumed by another bash command in a later step.
- Do not wrap a single read-only command in mktemp + redirection if you are not going to do another bash follow-up with that file.
- Prefer sequential commands over shell pipelines when the output may be large or reused.
- Avoid using pipes as the default way to chain read/search/inspection commands.
- When a tempfile is truly needed, prefer patterns like: ${mktempExample}
- Clean up temporary files when they are no longer needed.
`;
}

export default function bashTempfileGuidance(pi: ExtensionAPI) {
	pi.on("before_agent_start", async (event) => ({
		systemPrompt: event.systemPrompt + buildBashTempfileGuidance(os.tmpdir()),
	}));
}
