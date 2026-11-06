# Hand-off: the lead's tools, and the plan for Episode 21 (Fable 5.1 on the owner's API credits)

These are the production tools that lived in `/tmp/shift_tools` during Episodes 13 to 20 (contact sheets, the layout and brightness gates, the segmented render, the verification, the README and PR-body generators) plus every builder brief (`briefs/`). The run-book with the state of each episode is `EP15_STATE.md`.

## Restore them in a new session
```
mkdir -p /tmp/shift_tools && cp -r /home/user/workblock100/fruit-video/lead_tools/* /tmp/shift_tools/
# the scripts write scratch output under the OLD session's scratchpad path: point them at the new one
OLD=/tmp/claude-0/-home-user-workblock100/a7ae9cc7-3306-516a-9318-51e578ae52e3/scratchpad
NEW=<this session's scratchpad directory>
grep -rl "$OLD" /tmp/shift_tools | xargs sed -i "s#$OLD#$NEW#g"
```
The TTS model and voices (`kokoro-v1.0.onnx`, `voices-v1.0.bin`) were in the old scratchpad's `tts/` folder and are NOT in the repository: download them again (kokoro-onnx v1.0 release files) before building any audio.

## Episode 21 (THE INSPECTION, teased on Episode 20's end card): the owner's request
The owner wants Episode 21 made by Claude Fable 5.1 (`claude-fable-5-1`; "Fable 5.5" does not exist) at `output_config.effort: "max"`, paid from the owner's own API credits (about $89 on the Console), and NOT from the Claude Code session's plan usage.
- The API key comes ONLY from the environment: a secret or variable named `FABLE_API_KEY` that the owner adds in the environment settings. Never ask for it in chat, never print it, never commit it. Do not name it `ANTHROPIC_API_KEY` (Claude Code itself could pick that up and bill the session to the credits).
- Install the SDK (`pip install anthropic`), construct the client with the key from `FABLE_API_KEY` and an explicit `base_url="https://api.anthropic.com"`; stream every request (max effort, `max_tokens` up to 128000); omit `thinking` (Fable's thinking is always on); check `stop_reason` (refusal, max_tokens) before using content.
- Budget: hard cap about $87 of the $89.29 balance. Log every call (input, cache write, cache read, output tokens) and its cost at the Fable 5.1 prices ($10 per MTok input, $12.50 cache write, $0.25 cache read, $50 output) to a ledger file; before each call, refuse if the worst case (max_tokens at the output price) would cross the cap. Cache the big shared context (engine guide, kit APIs, example scenes) so repeated calls pay the cache-read price.
- Division of work: Fable writes the episode (premise, script in the `gen_script` format, jokes) and the code of every scene, the title and the end card; the lead (Claude Code) only wires files, freezes the timeline with the existing audio pipeline, renders, runs the gates (`audit_scene.sh`, `luma_scene.py`), makes contact sheets and sends Fable the gate output and the sheets as images for its fix rounds, as many rounds as the budget allows. Keep the session's own work light.
- Report to the owner at the end: the episode, and a receipt of the API spend per step from the ledger.
