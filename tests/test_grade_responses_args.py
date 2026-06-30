from unittest.mock import patch


from grade_responses import parse_args

class TestParseArgs:
    def test_default_args(self):
        with patch('sys.argv', ['grade_responses.py']):
            args = parse_args()
            assert args.state == "ddia_progress.db"
            assert args.output == "ddia_grades_report.md"
            assert args.provider is None
            assert args.model is None

    def test_custom_state(self):
        with patch('sys.argv', ['grade_responses.py', '--state', 'custom_state.json']):
            args = parse_args()
            assert args.state == "custom_state.json"
            assert args.output == "ddia_grades_report.md"
            assert args.provider is None
            assert args.model is None

    def test_custom_state_and_output(self):
        with patch('sys.argv', ['grade_responses.py', '--state', 'custom_state.json', '--output', 'custom_output.md']):
            args = parse_args()
            assert args.state == "custom_state.json"
            assert args.output == "custom_output.md"
            assert args.provider is None
            assert args.model is None

    def test_all_args(self):
        with patch('sys.argv', ['grade_responses.py', '--state', 'custom_state.json', '--output', 'custom_output.md', '--provider', 'openai', '--model', 'gpt-4o']):
            args = parse_args()
            assert args.state == "custom_state.json"
            assert args.output == "custom_output.md"
            assert args.provider == "openai"
            assert args.model == "gpt-4o"
