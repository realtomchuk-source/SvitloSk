import json
import logging
# Note: google-generativeai would be installed in the environment
try:
    import google.generativeai as genai
except ImportError:
    genai = None

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("PromptTester")

class GeminiPromptTester:
    def __init__(self, api_key=None):
        self.api_key = api_key
        if genai and api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None
            logger.warning("Gemini API key not provided or library not installed. Tool in MOCK mode.")

    def test_prompt(self, prompt_template, news_text):
        """Tests a specific prompt template against a piece of news text."""
        full_prompt = prompt_template.replace("{{text}}", news_text)
        
        if not self.model:
            # Mock response for testing structure
            return {
                "mock_response": "This is a mock response. Please provide an API key.",
                "status": "MOCK"
            }
        
        try:
            response = self.model.generate_content(full_prompt)
            return {
                "response": response.text,
                "status": "SUCCESS"
            }
        except Exception as e:
            return {
                "error": str(e),
                "status": "ERROR"
            }

if __name__ == "__main__":
    # Example of how to use the tester
    API_KEY = "YOUR_GEMINI_API_KEY" # To be replaced by os.getenv
    tester = GeminiPromptTester(API_KEY)
    
    sample_text = "Графік обмежень на 8 квітня. Черга 1.1: світло буде з 07:00 до 11:00 та з 15:00 до 19:00."
    
    prompt_v1 = "Extract power outages from this text: {{text}}. Return JSON: {'queue': '...', 'status': '...'}"
    prompt_v2 = "You are a power grid expert. Analyze the following news text and extract the schedule in a strict JSON format. Text: {{text}}"
    
    logger.info("Testing Prompt V1...")
    print(tester.test_prompt(prompt_v1, sample_text))
    
    logger.info("Testing Prompt V2...")
    print(tester.test_prompt(prompt_v2, sample_text))
