"""Text-to-Speech — unchanged from original, no Streamlit dependency."""

from io import BytesIO
from gtts import gTTS


class TextToSpeech:
    def speak(self, text: str, lang: str = "en") -> bytes | None:
        cleaned = (text or "").strip()

        if not cleaned:
            return None

        buffer = BytesIO()
        gTTS(text=cleaned, lang=lang).write_to_fp(buffer)
        buffer.seek(0)

        return buffer.read()
