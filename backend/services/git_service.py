import asyncio
import io
import os
import re
import shutil
import tempfile
import urllib.request
import zipfile
from pathlib import Path

# Use system temp dir so it works on both Windows and Linux
_TMP_BASE = os.path.join(tempfile.gettempdir(), "codegraph")

SUPPORTED_EXTENSIONS = {
    '.py': 'python',
    '.js': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.jsx': 'javascript',
    '.go': 'go',
    '.rs': 'rust',
}

IGNORE_DIRS = {
    '.git', 'node_modules', '__pycache__', '.venv', 'venv',
    'dist', 'build', '.next', 'vendor', 'target', '.pytest_cache',
    'coverage', '.nyc_output', 'eggs', '.eggs',
}

MAX_FILES = 100  # cap to keep node count manageable for browser rendering


def _github_zip_url(repo_url: str) -> str | None:
    """Return GitHub archive zip URL if this is a GitHub repo, else None."""
    m = re.match(r'https?://github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$', repo_url)
    if m:
        return f"https://github.com/{m.group(1)}/{m.group(2)}/archive/HEAD.zip"
    return None


def _download_and_extract_zip(zip_url: str, tmp_dir: str) -> None:
    """Download GitHub archive zip and extract contents into tmp_dir."""
    print(f"[git] Downloading zip from {zip_url}")
    req = urllib.request.Request(zip_url, headers={"User-Agent": "codegraph/1.0"})
    with urllib.request.urlopen(req, timeout=120) as response:
        data = response.read()
    print(f"[git] Downloaded {len(data) // 1024}KB, extracting…")

    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        names = zf.namelist()
        # GitHub zips have a top-level dir like {repo}-HEAD/ — strip it
        prefix = names[0].split('/')[0] + '/' if names else ''
        for name in names:
            rel = name[len(prefix):]
            if not rel:
                continue
            target = os.path.join(tmp_dir, rel)
            if name.endswith('/'):
                os.makedirs(target, exist_ok=True)
            else:
                os.makedirs(os.path.dirname(target), exist_ok=True)
                with zf.open(name) as src, open(target, 'wb') as dst:
                    dst.write(src.read())


async def clone_repo(repo_url: str, job_id: str) -> str:
    """Fetch repo to temp dir. Uses zip download for GitHub, git clone otherwise."""
    tmp_dir = os.path.join(_TMP_BASE, job_id)
    if os.path.exists(tmp_dir):
        shutil.rmtree(tmp_dir)
    os.makedirs(tmp_dir, exist_ok=True)

    zip_url = _github_zip_url(repo_url)
    if zip_url:
        await asyncio.to_thread(_download_and_extract_zip, zip_url, tmp_dir)
    else:
        import git
        await asyncio.to_thread(
            git.Repo.clone_from, repo_url, tmp_dir,
            **{"depth": 1, "single_branch": True}
        )
    return tmp_dir


def get_source_files(repo_path: str) -> list:
    """Walk repo and return list of {path, language, content}."""
    files = []
    for root, dirs, filenames in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS and not d.startswith('.')]
        for fname in filenames:
            ext = Path(fname).suffix
            if ext in SUPPORTED_EXTENSIONS:
                fpath = os.path.join(root, fname)
                rel_path = os.path.relpath(fpath, repo_path)
                try:
                    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    if len(content) > 5 and len(content) < 500_000:  # skip empty/huge files
                        files.append({
                            'path': rel_path.replace('\\', '/'),
                            'language': SUPPORTED_EXTENSIONS[ext],
                            'content': content,
                            'lines': content.count('\n') + 1,
                        })
                except Exception:
                    pass

    # For large repos, prefer shallower paths (core files) and cap at MAX_FILES
    if len(files) > MAX_FILES:
        files.sort(key=lambda f: (f['path'].count('/'), f['path']))
        files = files[:MAX_FILES]

    return files


def cleanup_repo(job_id: str):
    shutil.rmtree(os.path.join(_TMP_BASE, job_id), ignore_errors=True)
