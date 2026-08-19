#!/usr/bin/env python3
import os, sys, time, json, urllib.request

KEY = os.environ.get("QWEN_API_KEY")
if not KEY:
    print("QWEN_API_KEY is required", file=sys.stderr)
    sys.exit(1)

MODEL = os.environ.get("MODEL", "wan2.2-t2i-flash")
SIZE = os.environ.get("SIZE", "1344*768")  # 16:9-ish within allowed range
OUT_DIR = "docs/images"
os.makedirs(OUT_DIR, exist_ok=True)

SUBMIT_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis"
TASK_URL = "https://dashscope.aliyuncs.com/api/v1/tasks/"

def http_json(req):
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))

def submit(prompt):
    body = json.dumps({
        "model": MODEL,
        "input": {"prompt": prompt},
        "parameters": {"size": SIZE, "n": 1},
    }).encode("utf-8")
    req = urllib.request.Request(
        SUBMIT_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
            "X-DashScope-Async": "enable",
        },
        method="POST",
    )
    return http_json(req)

def poll(task_id):
    for _ in range(90):
        req = urllib.request.Request(
            TASK_URL + task_id,
            headers={"Authorization": f"Bearer {KEY}"},
            method="GET",
        )
        res = http_json(req)
        out = res.get("output", {})
        status = out.get("task_status")
        if status == "SUCCEEDED":
            return out["results"][0]["url"]
        if status in ("FAILED", "CANCELED"):
            raise RuntimeError(json.dumps(res, ensure_ascii=False))
        time.sleep(2)
    raise TimeoutError(f"task {task_id} timeout")

def gen(name, prompt):
    print(f"==> {name}")
    res = submit(prompt)
    task_id = res.get("output", {}).get("task_id")
    if not task_id:
        raise RuntimeError(json.dumps(res, ensure_ascii=False))
    url = poll(task_id)
    path = os.path.join(OUT_DIR, name)
    with urllib.request.urlopen(url, timeout=120) as r, open(path, "wb") as f:
        f.write(r.read())
    print(f"saved {path}")

JOBS = [
    ("hero.png",
     "Product-grade hero illustration for 'Chirp', a content orchestration canvas. "
     "Show a clean infinite canvas with connected nodes labeled Knowledge, Marketing, Repurpose, Schedule; "
     "an AI agent sidebar guiding the flow; modern SaaS aesthetic, crisp UI, high information density, "
     "professional, 16:9 composition, not a screenshot, no watermark, no logos"),
    ("context-hell.png",
     "Concept illustration: scattered chat bubbles, Telegram threads, and docs on the left; "
     "arrows converge into a single orchestrated canvas on the right labeled Chirp. "
     "Visual metaphor for escaping 'context hell' into an executable workflow. "
     "Clean, minimal, product-grade infographic, 16:9, no watermark"),
    ("orchestration-layer.png",
     "Layered architecture illustration: upstream model capabilities (Minds), "
     "middle orchestration layer 'Chirp' (canvas, agent, state), downstream publishing and operations. "
     "Arrows show data flow. Professional system diagram, high clarity, 16:9, product-grade, no watermark"),
]

if __name__ == "__main__":
    for name, prompt in JOBS:
        gen(name, prompt)
    print("Done.")
