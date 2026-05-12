from pathlib import Path


ROOT = Path(r"E:\Work\Founder-Systems-github\dist")
ROUTES = [
    ROOT / "tools" / "founder-spec-generator" / "index.html",
    ROOT / "Products" / "index.html",
    ROOT / "products" / "index.html",
]


def main():
    source = (ROOT / "index.html").read_text(encoding="utf-8")
    for target in ROUTES:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(source, encoding="utf-8")
        print(f"Wrote {target}")


if __name__ == "__main__":
    main()
