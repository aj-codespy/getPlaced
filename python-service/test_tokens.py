import asyncio
import os
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "web", ".env"))

class Output(BaseModel):
    text: str

async def test():
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", api_key=os.environ.get("GEMINI_API_KEY"))
    llm_structured = llm.with_structured_output(Output, include_raw=True)
    res = await llm_structured.ainvoke("Say hello")
    print(res)
    print("KEYS:", res.keys())
    if "raw" in res:
        print("METADATA:", res["raw"].response_metadata)

asyncio.run(test())
