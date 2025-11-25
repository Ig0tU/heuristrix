"""Process Analyst Agent for Hephaestus."""

import logging
import uuid
from typing import Dict, Any, List

from src.core.database import DatabaseManager, Task, ProcessSuggestion, get_db
from src.interfaces import LLMProviderInterface

logger = logging.getLogger(__name__)

# Prompt for the Process Analyst Agent
PROCESS_ANALYST_PROMPT = """
You are a Process Analyst Agent for the Hephaestus autonomous development platform.
Your role is to analyze patterns of inefficiency in the software development workflow and suggest concrete, actionable improvements to the process.

You have been triggered because of the following event:
{triggering_event}

Here are the tasks related to this event:
{tasks}

And here is the overall project context:
{project_context}

Based on this information, your task is to:
1.  Analyze the root cause of the inefficiency.
2.  Propose a specific, actionable change to the instructions for one of the development phases.
3.  Provide a clear reasoning for your suggestion.

Your suggestion should be in the following format:
{
    "phase_id": "<The ID of the phase to be improved>",
    "suggestion_text": "<Your suggested change to the phase instructions>",
    "reasoning": "<Your reasoning for the suggestion>"
}
"""


class ProcessAnalystAgent:
    """Agent that analyzes workflow inefficiencies and suggests improvements."""

    def __init__(self, db_manager: DatabaseManager, llm_provider: LLMProviderInterface):
        """Initialize the Process Analyst agent.

        Args:
            db_manager: Database manager instance
            llm_provider: LLM provider for generating prompts and suggestions
        """
        self.db_manager = db_manager
        self.llm_provider = llm_provider

    async def analyze_and_suggest(
        self,
        triggering_event: Dict[str, Any],
        tasks: List[Task],
        project_context: str,
    ) -> None:
        """Analyze a workflow event and generate a suggestion.

        Args:
            triggering_event: The event that triggered the analysis
            tasks: A list of tasks related to the event
            project_context: The overall project context
        """
        logger.info(f"Process Analyst triggered by: {triggering_event['type']}")

        prompt = PROCESS_ANALYST_PROMPT.format(
            triggering_event=triggering_event,
            tasks=[task.enriched_description for task in tasks],
            project_context=project_context,
        )

        suggestion_json = await self.llm_provider.generate_suggestion(prompt)
        suggestion = suggestion_json

        with get_db() as db:
            new_suggestion = ProcessSuggestion(
                id=str(uuid.uuid4()),
                phase_id=suggestion["phase_id"],
                suggestion_text=suggestion["suggestion_text"],
                reasoning=suggestion["reasoning"],
                triggering_event=triggering_event,
            )
            db.add(new_suggestion)
            db.commit()

        logger.info(f"Generated and saved suggestion: {suggestion}")
