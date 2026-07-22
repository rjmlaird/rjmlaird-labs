import csv
import os
import subprocess
import requests

# Config
OWNER = "rjmlaird"
REPO = "rjmlaird-labs"
CSV_FILE = "github-issue-import.csv"

def get_gh_token():
    # Reuse your existing gh token
    result = subprocess.run(
        ["gh", "auth", "token"],
        capture_output=True,
        text=True,
        check=True
    )
    return result.stdout.strip()

def create_issue(session, title, body, labels, milestone_name=None):
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/issues"
    headers = {
        "Authorization": f"token {session['token']}",
        "Accept": "application/vnd.github.v3+json",
    }
    payload = {
        "title": title,
        "body": body,
        "labels": [l.strip() for l in labels.split(",") if l.strip()],
    }
    if milestone_name:
        # Resolve milestone by name
        milestones_url = f"https://api.github.com/repos/{OWNER}/{REPO}/milestones"
        resp = requests.get(milestones_url, headers=headers, timeout=10)
        resp.raise_for_status()
        milestones = resp.json()
        milestone = next((m for m in milestones if m["title"] == milestone_name), None)
        if milestone:
            payload["milestone"] = milestone["number"]

    resp = requests.post(url, headers=headers, json=payload, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    print(f"Created #{data['number']}: {data['title']}")

def main():
    token = get_gh_token()
    session = {"token": token}

    with open(CSV_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=2):
            title = row.get("title", "").strip()
            body = row.get("body", "").strip()
            labels = row.get("labels", "")
            milestone = row.get("milestone", "").strip() or None

            if not title:
                print(f"Skipping row {i}: missing title")
                continue

            try:
                create_issue(session, title, body, labels, milestone)
            except Exception as e:
                print(f"Error on row {i} ({title}): {e}")

if __name__ == "__main__":
    main()
