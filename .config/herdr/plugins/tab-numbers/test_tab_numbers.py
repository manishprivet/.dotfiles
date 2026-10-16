"""Unit tests use a fake Herdr API; no running terminals are changed."""

import copy
import unittest

from tab_numbers import reconcile


class FakeHerdr:
    def __init__(self, tabs):
        self.items = tabs
        self.renames = []

    def tabs(self):
        return copy.deepcopy(self.items)

    def rename(self, tab_id, label):
        self.renames.append((tab_id, label))
        next(tab for tab in self.items if tab["tab_id"] == tab_id)["label"] = label


def tab(tab_id="w1:t1", number=1, label="editor"):
    return {"tab_id": tab_id, "number": number, "label": label}


class NumberingTests(unittest.TestCase):
    def sync(self, api, state, mode="sync"):
        reconcile(api, state, mode, lambda value: None)

    def test_numbers_are_per_space_and_follow_api_numbers(self):
        api = FakeHerdr([tab(), tab("w2:t1", 1, "shell"), tab("w1:t9", 2, "tests")])
        self.sync(api, {})
        self.assertEqual([t["label"] for t in api.items], ["1: editor", "1: shell", "2: tests"])

    def test_rename_events_are_idempotent(self):
        api, state = FakeHerdr([tab()]), {}
        self.sync(api, state)
        self.sync(api, state)
        self.assertEqual(api.renames, [("w1:t1", "1: editor")])

    def test_close_and_move_renumber_without_stacking_prefixes(self):
        api, state = FakeHerdr([tab(), tab("w1:t2", 2, "shell")]), {}
        self.sync(api, state)
        api.items.pop(0)
        api.items[0]["number"] = 1
        self.sync(api, state)
        self.assertEqual(api.items[0]["label"], "1: shell")
        self.assertNotIn("w1:t1", state["tabs"])

    def test_manual_rename_is_preserved(self):
        api, state = FakeHerdr([tab()]), {}
        self.sync(api, state)
        api.items[0]["label"] = "new title 🚀"
        self.sync(api, state)
        self.assertEqual(api.items[0]["label"], "1: new title 🚀")

    def test_literal_numeric_title_is_not_stripped(self):
        api, state = FakeHerdr([tab(label="2026: notes")]), {}
        self.sync(api, state)
        self.sync(api, state, "remove")
        self.assertEqual(api.items[0]["label"], "2026: notes")

    def test_remove_pauses_events_and_refresh_reenables(self):
        api, state = FakeHerdr([tab()]), {}
        self.sync(api, state)
        self.sync(api, state, "remove")
        self.sync(api, state)
        self.assertEqual(api.items[0]["label"], "editor")
        self.sync(api, state, "refresh")
        self.assertEqual(api.items[0]["label"], "1: editor")

    def test_remove_does_not_overwrite_external_rename(self):
        api, state = FakeHerdr([tab()]), {}
        self.sync(api, state)
        api.items[0]["label"] = "user title"
        self.sync(api, state, "remove")
        self.assertEqual(api.items[0]["label"], "user title")

    def test_state_survives_restart(self):
        api, state = FakeHerdr([tab()]), {}
        self.sync(api, state)
        import json

        restored = json.loads(json.dumps(state))
        self.sync(api, restored)
        self.assertEqual(len(api.renames), 1)


if __name__ == "__main__":
    unittest.main()
