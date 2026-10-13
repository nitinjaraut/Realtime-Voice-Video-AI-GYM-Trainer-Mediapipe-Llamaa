"""LLM Coach — adapted for FastAPI (no Streamlit dependency)."""

from services.config.workout_config import COACH_SYSTEM_PROMPT


class LLMCoach:
    def __init__(self, groq_client):
        self.client = groq_client
        self.history: list[dict] = []
        self.system_prompt = COACH_SYSTEM_PROMPT

    def give_feedback(self, event: str, issue: str | None) -> str:
        prompt = f"Event: {event}"

        if issue:
            prompt += f" Form Issue: {issue}"

        messages = [
            {"role": "system", "content": self.system_prompt},
            *self.history[-10:],
            {"role": "user", "content": prompt},
        ]

        response = self.client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=messages,
            temperature=0.4,
        )

        text = response.choices[0].message.content.strip()
        self.history.append({"role": "assistant", "content": text})

        return text
