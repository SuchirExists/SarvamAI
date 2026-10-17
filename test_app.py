"""Offline HTTP-handler checks; never contacts Sarvam."""
import io
import json
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import app


class AppTests(unittest.TestCase):
    def request(self, body=None, path="/api/phrase", origin="http://127.0.0.1:8000", method="POST"):
        payload = json.dumps(body).encode()
        handler = object.__new__(app.Handler)
        handler.path = path
        handler.headers = {"Content-Length": str(len(payload)), "Origin": origin}
        handler.rfile = io.BytesIO(payload)
        result = []
        handler.respond = lambda status, body, *args: result.append((status, body))
        getattr(handler, "do_" + method)()
        return result[0]

    def test_static_files_and_private_paths(self):
        for path in ("/", "/style.css", "/app.js"):
            self.assertEqual(self.request(path=path, method="GET")[0], 200)
        for path in ("/.env", "/.git/config", "/app.py", "/../.env"):
            self.assertEqual(self.request(path=path, method="GET")[0], 404)

    @patch.object(app, "create_client")
    def test_invalid_inputs_do_not_call_sdk(self, sdk):
        for body in (None, [], {}, {"language": "Invalid", "situation": "cafe"},
                     {"language": "Hindi", "situation": "cafe", "context": "x" * 301}):
            self.assertEqual(self.request(body)[0], 400)
        self.assertEqual(self.request({}, origin="https://example.com")[0], 403)
        sdk.assert_not_called()

    @patch.object(app, "SarvamAI")
    def test_missing_key_does_not_call_sdk(self, sdk):
        with patch.dict(app.os.environ, {"SARVAM_API_KEY": ""}):
            self.assertEqual(self.request({"language": "Hindi", "situation": "cafe"})[0], 503)
        sdk.assert_not_called()

    @patch.object(app, "create_client")
    def test_live_request_and_response_format(self, sdk):
        phrase = {"phrase": "नमस्ते", "pronunciation": "Namaste", "meaning": "Hello", "tip": "A greeting."}
        call = sdk.return_value.chat.completions
        for content in (json.dumps(phrase), "```json\n" + json.dumps(phrase) + "\n```"):
            call.return_value = SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])
            self.assertEqual(self.request({"language": "Hindi", "situation": "cafe", "context": "Less sugar"}), (200, phrase))
            kwargs = call.call_args.kwargs
            self.assertEqual(kwargs["model"], "sarvam-105b-conversations")
            self.assertEqual(kwargs["request_options"]["max_retries"], 0)
            self.assertEqual(json.loads(kwargs["messages"][1]["content"])["note"], "Less sugar")

    @patch.object(app, "create_client")
    def test_upstream_errors_are_safe_and_actionable(self, sdk):
        for upstream, expected, word in ((402, 402, "credits"), (401, 502, "authorize"), (403, 502, "authorize"), (500, 502, "try again")):
            sdk.return_value.chat.completions.side_effect = app.ApiError(status_code=upstream, body={"internal": "not-for-browser"})
            status, body = self.request({"language": "Hindi", "situation": "cafe"})
            self.assertEqual(status, expected)
            self.assertIn(word, body["error"])
            self.assertNotIn("not-for-browser", json.dumps(body))
        sdk.return_value.chat.completions.side_effect = ConnectionError("not-for-browser")
        self.assertIn("connection", self.request({"language": "Hindi", "situation": "cafe"})[1]["error"])

    @patch.object(app, "create_client")
    def test_bad_model_output_is_rejected(self, sdk):
        for content in ("not JSON", "{}", "[]", '{"phrase": ""}'):
            sdk.return_value.chat.completions.return_value = SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])
            self.assertEqual(self.request({"language": "Hindi", "situation": "cafe"})[0], 502)


if __name__ == "__main__":
    unittest.main()
