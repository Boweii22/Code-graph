import re
from typing import Optional

# Lazy-load tree-sitter languages to avoid import errors if packages missing
_LANGUAGES = {}


def _get_language(lang: str):
    if lang in _LANGUAGES:
        return _LANGUAGES[lang]
    try:
        from tree_sitter import Language, Parser
        if lang == 'python':
            import tree_sitter_python as ts_lang
            _LANGUAGES[lang] = Language(ts_lang.language())
        elif lang == 'javascript':
            import tree_sitter_javascript as ts_lang
            _LANGUAGES[lang] = Language(ts_lang.language())
        elif lang == 'typescript':
            import tree_sitter_typescript as ts_lang
            _LANGUAGES[lang] = Language(ts_lang.language_typescript())
        elif lang == 'go':
            import tree_sitter_go as ts_lang
            _LANGUAGES[lang] = Language(ts_lang.language())
        elif lang == 'rust':
            import tree_sitter_rust as ts_lang
            _LANGUAGES[lang] = Language(ts_lang.language())
        return _LANGUAGES.get(lang)
    except Exception:
        return None


def parse_file(file_info: dict) -> dict:
    """Parse a source file. Returns {functions, classes, imports}."""
    lang = file_info['language']
    language = _get_language(lang)

    if language is None:
        # Fallback: use regex-based parsing
        return _regex_parse(file_info)

    try:
        from tree_sitter import Parser
        parser = Parser(language)
        source = file_info['content'].encode('utf-8')
        tree = parser.parse(source)
        return _walk_tree(tree, source, lang)
    except Exception:
        return _regex_parse(file_info)


def _walk_tree(tree, source: bytes, lang: str) -> dict:
    functions = []
    classes = []
    imports = []

    def get_text(node):
        return source[node.start_byte:node.end_byte].decode('utf-8', errors='ignore')

    def walk(node, parent_class=None):
        # --- Function / Method definitions ---
        if node.type in (
            'function_definition', 'async_function_definition',  # Python
            'function_declaration', 'method_definition',          # JS/TS
            'arrow_function',                                      # JS/TS
            'function_item',                                       # Rust
            'func_literal', 'function_declaration',               # Go
        ):
            name_node = node.child_by_field_name('name')
            if name_node:
                body = get_text(node)
                preview_lines = body.split('\n')[:10]
                functions.append({
                    'name': get_text(name_node),
                    'line_start': node.start_point[0] + 1,
                    'line_end': node.end_point[0] + 1,
                    'body': body,
                    'preview': '\n'.join(preview_lines),
                    'parent_class': parent_class,
                    'calls': extract_calls(body, lang),
                })

        # --- Class definitions ---
        elif node.type in (
            'class_definition',       # Python
            'class_declaration',      # JS/TS
            'struct_item',            # Rust
            'type_declaration',       # Go
            'impl_item',              # Rust impl blocks
        ):
            name_node = node.child_by_field_name('name')
            if name_node:
                class_name = get_text(name_node)
                classes.append({
                    'name': class_name,
                    'line_start': node.start_point[0] + 1,
                    'line_end': node.end_point[0] + 1,
                })
                for child in node.children:
                    walk(child, parent_class=class_name)
                return

        # --- Import statements ---
        elif node.type in (
            'import_statement', 'import_from_statement',  # Python
            'import_declaration', 'export_statement',     # JS/TS
            'use_declaration',                            # Rust
            'import_spec',                                # Go
        ):
            imp = extract_import(node, lang, get_text)
            if imp:
                imports.append(imp)

        for child in node.children:
            walk(child, parent_class)

    walk(tree.root_node)
    return {
        'functions': functions,
        'classes': classes,
        'imports': list(set(i for i in imports if i)),
    }


def _regex_parse(file_info: dict) -> dict:
    """Regex-based fallback parser."""
    content = file_info['content']
    lang = file_info['language']
    functions = []
    classes = []
    imports = []

    if lang == 'python':
        # Functions
        for m in re.finditer(r'^(?:async\s+)?def\s+(\w+)\s*\(', content, re.MULTILINE):
            line = content[:m.start()].count('\n') + 1
            functions.append({
                'name': m.group(1),
                'line_start': line,
                'line_end': line + 5,
                'body': '',
                'preview': '',
                'parent_class': None,
                'calls': [],
            })
        # Classes
        for m in re.finditer(r'^class\s+(\w+)', content, re.MULTILINE):
            line = content[:m.start()].count('\n') + 1
            classes.append({'name': m.group(1), 'line_start': line, 'line_end': line + 10})
        # Imports
        for m in re.finditer(r'^(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))', content, re.MULTILINE):
            mod = (m.group(1) or m.group(2)).split('.')[0]
            imports.append(mod)

    elif lang in ('javascript', 'typescript'):
        # Functions
        for m in re.finditer(r'(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\()', content):
            name = m.group(1) or m.group(2)
            if name:
                line = content[:m.start()].count('\n') + 1
                functions.append({
                    'name': name,
                    'line_start': line,
                    'line_end': line + 5,
                    'body': '',
                    'preview': '',
                    'parent_class': None,
                    'calls': [],
                })
        # Classes
        for m in re.finditer(r'class\s+(\w+)', content):
            line = content[:m.start()].count('\n') + 1
            classes.append({'name': m.group(1), 'line_start': line, 'line_end': line + 10})
        # Imports
        for m in re.finditer(r"(?:import|require)\s*\(?['\"]([^'\"]+)['\"]", content):
            pkg = m.group(1)
            if not pkg.startswith('.'):
                imports.append(pkg.split('/')[0])

    return {
        'functions': functions,
        'classes': classes,
        'imports': list(set(imports)),
    }


PYTHON_BUILTINS = {
    'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict',
    'set', 'tuple', 'type', 'isinstance', 'hasattr', 'getattr', 'setattr',
    'super', 'enumerate', 'zip', 'map', 'filter', 'sorted', 'reversed',
    'open', 'bool', 'bytes', 'repr', 'format', 'input', 'abs', 'max', 'min',
    'sum', 'any', 'all', 'iter', 'next', 'vars', 'dir', 'id', 'hash',
}


def extract_calls(body: str, lang: str) -> list:
    """Extract called function names from a function body."""
    if lang == 'python':
        calls = re.findall(r'\b([a-z_][a-zA-Z0-9_]*)\s*\(', body)
        return [c for c in set(calls) if c not in PYTHON_BUILTINS and len(c) > 2]
    elif lang in ('javascript', 'typescript'):
        calls = re.findall(r'\b([a-z_$][a-zA-Z0-9_$]*)\s*\(', body)
        js_builtins = {'if', 'for', 'while', 'switch', 'catch', 'require', 'console'}
        return [c for c in set(calls) if c not in js_builtins and len(c) > 2]
    return []


def extract_import(node, lang: str, get_text) -> Optional[str]:
    text = get_text(node)
    if lang == 'python':
        m = re.match(r'from\s+([\w.]+)\s+import|import\s+([\w.]+)', text)
        if m:
            return (m.group(1) or m.group(2)).split('.')[0]
    elif lang in ('javascript', 'typescript'):
        m = re.search(r"from\s+['\"]([^'\"]+)['\"]|require\(['\"]([^'\"]+)['\"]\)", text)
        if m:
            pkg = m.group(1) or m.group(2)
            if not pkg.startswith('.'):
                return pkg.split('/')[0].lstrip('@')
    elif lang == 'rust':
        m = re.match(r'use\s+([\w:]+)', text)
        if m:
            return m.group(1).split('::')[0]
    elif lang == 'go':
        m = re.search(r'"([^"]+)"', text)
        if m:
            parts = m.group(1).split('/')
            if len(parts) > 1:
                return parts[-1]
    return None
