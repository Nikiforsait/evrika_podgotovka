"""Validate the generated content pack with SymPy.

Checks for every task:
  * `expr` evaluates (exactly) to `answer`;
  * the answer is an integer, a fraction with denominator <= 100, or a terminating
    decimal with at most 4 decimal places;
  * multiple-choice options are unique and contain the answer exactly once;
  * wrong-path values differ from the answer.

Run after `npm run content`:  python scripts/validate_content.py
"""
import json
import sys
from pathlib import Path

from sympy import Integer, Rational, nsimplify, simplify, sympify

PACK = Path(__file__).resolve().parent.parent / "content" / "generated" / "tasks.json"
MAX_DENOMINATOR = 100


def to_rational(text: str) -> Rational:
    return Rational(text)


def check(task: dict) -> list[str]:
    errors = []
    tid = task["id"]
    answer = to_rational(task["answer"])

    try:
        value = simplify(sympify(task["expr"]))
        if not value.is_Rational:  # nsimplify can mangle exact rationals, so only use it for irrational forms
            value = nsimplify(value)
    except Exception as exc:  # noqa: BLE001 - report any parse failure
        return [f"{tid}: cannot evaluate expr {task['expr']!r}: {exc}"]

    if simplify(value - answer) != 0:
        errors.append(f"{tid}: expr = {value}, but answer = {answer}")

    if task.get("display") == "digits":
        if not task["answer"].isdigit():
            errors.append(f"{tid}: digit answer must contain only digits")
    elif not isinstance(answer, (Integer, Rational)) or (answer.q > MAX_DENOMINATOR and 10000 % answer.q != 0):
        errors.append(f"{tid}: answer {answer} is not a clean number")

    for w in task.get("wrong", []):
        if to_rational(w["value"]) == answer:
            errors.append(f"{tid}: wrong path equals the answer ({w['value']})")

    options = task.get("options")
    if task["format"] == "choice":
        if not options or len(options) not in (2, 3, 4):
            errors.append(f"{tid}: expected 2–4 options, got {len(options or [])}")
        else:
            values = [to_rational(o["value"]) for o in options]
            if len(set(values)) != len(values):
                errors.append(f"{tid}: duplicate options {values}")
            if values.count(answer) != 1:
                errors.append(f"{tid}: answer must appear exactly once in options")
    return errors


def main() -> int:
    if not PACK.exists():
        print(f"Missing {PACK}. Run `npm run content` first.")
        return 1
    pack = json.loads(PACK.read_text(encoding="utf-8"))
    errors = [e for task in pack["tasks"] for e in check(task)]
    if errors:
        print("\n".join(errors))
        print(f"\nFAILED: {len(errors)} problem(s) in {len(pack['tasks'])} tasks")
        return 1
    print(f"OK: {len(pack['tasks'])} tasks validated with SymPy")
    return 0


if __name__ == "__main__":
    sys.exit(main())
