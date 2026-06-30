# Tests Directory Onboarding

Welcome to the test suite for the Designing Data-Intensive Applications (DDIA) learning and grading application. This directory houses all integration and unit tests validating the Flask server, LLM adapters, logging setup, and grading logic.

## Directory Index

```text
tests/
├── [test_grade_endpoint.py](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_grade_endpoint.py) ── Integration and contract tests for the Flask web API server, adaptor patterns, and JSON-to-object parsing.
├── [test_grade_responses.py](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_grade_responses.py) ── Parametrized unit tests validating the regex extraction logic for raw text-to-field fallbacks.
├── [test_grade_responses_args.py](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_grade_responses_args.py) ── Unit tests validating CLI argument parsing logic, boundary options, and defaults.
└── [test_logger_setup.py](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_logger_setup.py) ── Unit tests confirming log structure, JSON formatting, custom extra fields, and exception mapping.
```

---

## Component Categorization

The tests are logically grouped into three primary components:

### 1. Endpoint & Adapter Integration
- **File**: [test_grade_endpoint.py](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_grade_endpoint.py)
- **Key Symbols**:
  - [TestEndpointContract](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_grade_endpoint.py#L45): Verifies Flask routes (e.g., `/grade`, `/grade_summary`, `/`, and static files) and contract shapes using mock grading functions.
  - [TestLogging](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_grade_endpoint.py#L395): Confirms structured JSON log attributes are correctly emitted when endpoint routes are invoked.
  - [TestLLMGraderAdapter](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_grade_endpoint.py#L628): Ensures uniform interface behavior for LLM providers (Gemini, OpenAI, Claude) using mock-based responses.
  - [TestParseLlmJson](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_grade_endpoint.py#L791): Validates robust extraction of JSON from malformed, markdown-wrapped, or quote-polluted LLM responses.
  - [TestLiveGrading](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_grade_endpoint.py#L307), [TestLiveOpenAIGrading](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_grade_endpoint.py#L338), [TestLiveClaudeGrading](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_grade_endpoint.py#L369): End-to-end integration tests hitting live LLM API endpoints.

### 2. Core Logic & Utility Unit Tests
- **Files**:
  - [test_grade_responses.py](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_grade_responses.py)
  - [test_grade_responses_args.py](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_grade_responses_args.py)
- **Key Symbols**:
  - [test_extract_field](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_grade_responses.py#L89): Parameterized unit tests checking boundary conditions, missing fields, and unescaped quotes in regex-based JSON extraction.
  - [TestParseArgs](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_grade_responses_args.py#L6): Validates correct command-line argument extraction, database paths, and model configuration options.

### 3. Structured Logging Validation
- **File**: [test_logger_setup.py](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_logger_setup.py)
- **Key Symbols**:
  - [test_json_formatter_basic_fields](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_logger_setup.py#L10): Verifies standard dictionary layout (e.g., `ts`, `level`, `logger`, `msg`).
  - [test_json_formatter_extra_fields](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_logger_setup.py#L31): Verifies custom attributes map clean JSON fields in log entries.
  - [test_json_formatter_exc_info](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_logger_setup.py#L56): Tests tracebacks are converted into readable arrays of lines.
  - [test_custom_json_formatter_adds_timestamp](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_logger_setup.py#L83) & [test_custom_json_formatter_preserves_existing_timestamp](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_logger_setup.py#L115): Asserts timestamp creation, parsing, and non-overwrite behavior.

---

## Testing Setup & Execution

### Test Configuration
The testing environment is configured via:
- [pytest.ini](file:///Users/alejandrodiaz/Documents/projects/ddia/pytest.ini): Declares import paths (`pythonpath = .`) and registers markers:
  - `smoketest`: Fast mock-based smoke/unit tests that run without live API keys.
  - `live`: Live integration tests that call external LLM APIs.
- [conftest.py](file:///Users/alejandrodiaz/Documents/projects/ddia/conftest.py): Loads the environment variables, sets default testing values, and ensures the LLM client initializes cleanly in keyless environments.

### Execution Commands

All commands are run from the project root directory.

#### Running Offline / Mock Tests (Default/Safe Local Run)
To run all tests excluding those requiring external API network keys:
```bash
venv/bin/pytest -v -m "not live"
```

To run only the registered mock-based smoke and contract tests:
```bash
venv/bin/pytest -v -m smoketest
```

#### Running Live Integration Tests
To execute live integration tests, supply the corresponding provider credentials via environment variables:

- **Gemini**:
  ```bash
  LLM_PROVIDER=gemini LLM_KEY="your-gemini-api-key" venv/bin/pytest -v -m live
  ```
- **OpenAI**:
  ```bash
  LLM_PROVIDER=openai LLM_KEY="your-openai-api-key" venv/bin/pytest -v -m live
  ```
- **Claude (Anthropic)**:
  ```bash
  LLM_PROVIDER=claude LLM_KEY="your-claude-api-key" venv/bin/pytest -v -m live
  ```
