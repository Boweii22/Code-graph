from typing import Dict, List


def _make_file_id(path: str) -> str:
    return "file_" + path.replace('/', '_').replace('.', '_').replace('-', '_')


def _short_label(label: str, max_len: int = 24) -> str:
    short = label.split('/')[-1] if '/' in label else label
    return short[:max_len] + '…' if len(short) > max_len else short


def build_graph(repo_path: str, files: list, parsed: list) -> dict:
    """
    Build nodes and edges from parsed file data.
    Returns { nodes: [...], edges: [...] }
    """
    nodes: Dict[str, dict] = {}
    edges: List[dict] = []
    edge_set: set = set()

    def add_node(node_id: str, node_type: str, label: str, **kwargs):
        nodes[node_id] = {
            'id': node_id,
            'type': node_type,
            'label': label,
            'shortLabel': _short_label(label),
            **kwargs,
        }

    def add_edge(from_id: str, to_id: str, edge_type: str):
        if from_id not in nodes or to_id not in nodes:
            return
        if from_id == to_id:
            return
        key = (from_id, to_id, edge_type)
        if key in edge_set:
            return
        edge_set.add(key)
        edges.append({
            'id': f"e_{from_id[:20]}_{to_id[:20]}_{edge_type}",
            'source': from_id,
            'target': to_id,
            'type': edge_type,
        })

    # Lookup maps
    func_by_name: Dict[str, str] = {}    # name -> node_id
    class_by_name: Dict[str, str] = {}   # name -> node_id
    module_ids: Dict[str, str] = {}      # module_name -> node_id

    # 1. File nodes
    for file_info in files:
        fid = _make_file_id(file_info['path'])
        add_node(fid, 'File', file_info['path'],
                 language=file_info['language'],
                 lines=file_info['lines'])

    # 2. Class nodes
    for file_info, parse_result in zip(files, parsed):
        fid = _make_file_id(file_info['path'])
        for cls in parse_result['classes']:
            cid = f"cls_{cls['name']}_{fid}"[:80]
            if cid not in nodes:
                add_node(cid, 'Class', cls['name'],
                         file=file_info['path'],
                         language=file_info['language'],
                         lineStart=cls['line_start'],
                         lineEnd=cls['line_end'])
                class_by_name[cls['name']] = cid
            add_edge(cid, fid, 'DEFINED_IN')

    # 2b. INHERITS_FROM edges (after all classes are registered)
    for file_info, parse_result in zip(files, parsed):
        fid = _make_file_id(file_info['path'])
        for cls in parse_result['classes']:
            cid = f"cls_{cls['name']}_{fid}"[:80]
            for parent in cls.get('parents', []):
                if parent in class_by_name:
                    add_edge(cid, class_by_name[parent], 'INHERITS_FROM')

    # 3. Function nodes (cap per file to avoid browser freeze on large repos)
    MAX_FN_PER_FILE = 10
    for file_info, parse_result in zip(files, parsed):
        fid = _make_file_id(file_info['path'])
        fns = parse_result['functions'][:MAX_FN_PER_FILE]
        for fn in fns:
            fn_id = f"fn_{fn['name']}_{fid}"[:80]
            if fn_id not in nodes:
                add_node(fn_id, 'Function', fn['name'],
                         file=file_info['path'],
                         language=file_info['language'],
                         lineStart=fn['line_start'],
                         lineEnd=fn['line_end'],
                         sourcePreview=fn.get('preview', ''))
                func_by_name[fn['name']] = fn_id
            add_edge(fn_id, fid, 'DEFINED_IN')
            if fn.get('parent_class') and fn['parent_class'] in class_by_name:
                add_edge(fn_id, class_by_name[fn['parent_class']], 'BELONGS_TO')

    # 4. External module nodes
    all_imports: set = set()
    for parse_result in parsed:
        all_imports.update(i for i in parse_result.get('imports', []) if i)

    for mod_name in all_imports:
        mid = f"mod_{mod_name[:40]}"
        if mid not in nodes:
            add_node(mid, 'Module', mod_name, purpose='external dependency')
        module_ids[mod_name] = mid

    # 5. CALLS edges (function → function)
    for file_info, parse_result in zip(files, parsed):
        fid = _make_file_id(file_info['path'])
        for fn in parse_result['functions'][:MAX_FN_PER_FILE]:
            fn_id = f"fn_{fn['name']}_{fid}"[:80]
            for call in fn.get('calls', []):
                if call in func_by_name:
                    add_edge(fn_id, func_by_name[call], 'CALLS')

    # 6. DEPENDS_ON edges (file → module)
    for file_info, parse_result in zip(files, parsed):
        fid = _make_file_id(file_info['path'])
        for imp in parse_result.get('imports', []):
            if imp and imp in module_ids:
                add_edge(fid, module_ids[imp], 'DEPENDS_ON')

    return {
        'nodes': list(nodes.values()),
        'edges': edges,
    }
