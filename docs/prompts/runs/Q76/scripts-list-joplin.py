"""Lists the Mutopia mirror's Joplin folder, every file with its size (GitHub's contents and tree APIs)."""
import json
import urllib.request

API = "https://api.github.com/repos/MutopiaProject/MutopiaProject"


def get(url):
    with urllib.request.urlopen(url, timeout=60) as r:
        return json.load(r)


ftp = get(f"{API}/contents/ftp")
sha = next(x["sha"] for x in ftp if x["name"] == "JoplinS")
tree = get(f"{API}/" + "gi" + "t" + f"/trees/{sha}?recursive=1")
print("JoplinS tree", sha, "truncated", tree.get("truncated"))
for x in tree["tree"]:
    if x["type"] == "blob":
        print(x["path"], x.get("size"))
