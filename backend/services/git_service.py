import asyncio
import git
import os
import shutil
import tempfile
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


async def clone_repo(repo_url: str, job_id: str) -> str:
    """Clone repo to temp dir. Returns path to cloned repo."""
    tmp_dir = os.path.join(_TMP_BASE, job_id)
    if os.path.exists(tmp_dir):
        shutil.rmtree(tmp_dir)
    os.makedirs(tmp_dir, exist_ok=True)
    # Run blocking git clone in a thread so the event loop stays responsive
    await asyncio.to_thread(git.Repo.clone_from, repo_url, tmp_dir, **{"depth": 1})
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
    return files


def cleanup_repo(job_id: str):
    shutil.rmtree(os.path.join(_TMP_BASE, job_id), ignore_errors=True)
