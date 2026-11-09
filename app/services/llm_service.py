
from google import genai
from google.genai import types

from app.core.config import settings


class LLMService:

    @staticmethod
    def generate_response(
        prompt: str,
        tools: list | None = None
    ) -> str:

        if not settings.GEMINI_API_KEY:
            raise RuntimeError(
                "Gemini API key is not configured."
            )

        client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

        config = None

        if tools:
            config = types.GenerateContentConfig(
                tools=tools,
                automatic_function_calling=types.AutomaticFunctionCallingConfig(
                    disable=False,
                    maximum_remote_calls=10
                )
            )

        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=config
        )

        if not response.text:
            raise RuntimeError(
                "Gemini returned an empty response."
            )

        return response.text
