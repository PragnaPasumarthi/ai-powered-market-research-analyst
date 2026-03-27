from typing import TypedDict, List, Annotated
import operator
import os
from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from tavily import TavilyClient

# Define the state of our graph
class AgentState(TypedDict):
    query: str
    research_data: Annotated[List[str], operator.add]
    verified_data: Annotated[List[str], operator.add]
    report: str
    status: str
    errors: Annotated[List[str], operator.add]

# In a production app, LLM instances are created once per request or cached
# Initialize Gemini Flash (fast and free tier available)
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0,
    google_api_key=os.getenv("GOOGLE_API_KEY", "")
)
tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY", ""))

# Node 1: Researcher
def researcher_node(state: AgentState):
    print("--- RESEARCHER ---")
    query = state["query"]
    
    try:
        search_result = tavily_client.search(query=query, search_depth="basic", max_results=5)
        
        data_pieces = []
        if "results" in search_result:
            for result in search_result["results"]:
                snippet = f"- Source: {result.get('url')}\n  Content: {result.get('content')}"
                data_pieces.append(snippet)
                
        if not data_pieces:
            data_pieces.append(f"No search results found for '{query}'.")
            
        return {"research_data": data_pieces, "status": "Research Completed"}
    except Exception as e:
        return {"research_data": [f"Error searching: {str(e)}"], "status": "Research Errored"}

# Node 2: Auditor
def auditor_node(state: AgentState):
    print("--- AUDITOR ---")
    research_data = state.get("research_data", [])
    query = state["query"]
    
    system_prompt = (
        "You are a rigorous Market Research Auditor. "
        "Your job is to verify snippets of raw data returned from a web search about the user's query. "
        "Extract strictly factual, relevant, and credible data points. Ignore opinion, fluff, or hallucinated details. "
        "Format your output as a clean bulleted list of extracted facts."
    )
    
    human_content = f"User Query: {query}\n\nRaw Search Data:\n" + "\n\n".join(research_data)
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=human_content)
    ]
    
    try:
        response = llm.invoke(messages)
        return {"verified_data": [response.content], "status": "Verification Completed"}
    except Exception as e:
        return {"verified_data": [f"Auditor Error: {str(e)}"], "status": "Verification Errored"}

# Node 3: Report Generator
def report_generator_node(state: AgentState):
    print("--- REPORT GENERATOR ---")
    verified_data = state.get("verified_data", [])
    query = state["query"]
    
    system_prompt = (
        "You are an Executive Market Research Report Generator. "
        "Synthesize the provided verified data points into a professional, concise market research report. "
        "Format strictly in Markdown. Include an 'Executive Summary' and 'Key Findings' section. "
        "Only use the provided facts. Do not invent any new statistics."
    )
    
    human_content = f"Target Topic: {query}\n\nVerified Facts:\n" + "\n\n".join(verified_data)
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=human_content)
    ]
    
    try:
        response = llm.invoke(messages)
        return {"report": response.content, "status": "Report Generated"}
    except Exception as e:
        return {"report": f"Report Generation Error: {str(e)}", "status": "Report Errored"}

# Create the graph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("researcher", researcher_node)
workflow.add_node("auditor", auditor_node)
workflow.add_node("generator", report_generator_node)

# Define edges
if hasattr(START, '__class__'):
    workflow.add_edge(START, "researcher")
else:
    workflow.set_entry_point("researcher")
    
workflow.add_edge("researcher", "auditor")
workflow.add_edge("auditor", "generator")
workflow.add_edge("generator", END)

# Compile the graph
graph = workflow.compile()
