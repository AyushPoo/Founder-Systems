from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import os


class SpaHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=None, **kwargs):
        self._spa_directory = Path(directory or os.getcwd())
        super().__init__(*args, directory=str(self._spa_directory), **kwargs)

    def do_GET(self):
        request_path = self.path.split("?", 1)[0].split("#", 1)[0]
        candidate = (self._spa_directory / request_path.lstrip("/")).resolve()
        try:
            candidate.relative_to(self._spa_directory.resolve())
            in_root = True
        except ValueError:
            in_root = False

        if request_path == "/" or (in_root and candidate.exists()):
            return super().do_GET()

        self.path = "/index.html"
        return super().do_GET()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=4173)
    parser.add_argument("--dir", default="dist")
    args = parser.parse_args()

    root = Path(args.dir).resolve()
    server = ThreadingHTTPServer((args.host, args.port), lambda *a, **k: SpaHandler(*a, directory=root, **k))
    print(f"Serving {root} on http://{args.host}:{args.port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
