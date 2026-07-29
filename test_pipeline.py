import httpx, time, sys

task_id = sys.argv[1] if len(sys.argv) > 1 else "d8da7fc6"
print(f"Polling task: {task_id}")

for i in range(15):
    time.sleep(2)
    try:
        resp = httpx.get(f"http://localhost:8000/api/progress/{task_id}", timeout=5)
        data = resp.json()
        status = data.get("status", "?")
        progress = data.get("progress", 0)
        task = data.get("current_task", "")
        error = data.get("error")
        print(f"[{i}] Status: {status} | {progress}% | {task}")
        if error:
            print(f"  ERROR: {error}")
        if status in ("completed", "failed", "cancelled"):
            break
    except Exception as e:
        print(f"[{i}] Poll failed: {e}")
        break

print("Done")
