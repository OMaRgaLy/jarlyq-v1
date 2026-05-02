#!/usr/bin/env python3
"""
AI Data Parser for Jarlyq
Использует Claude API для парсинга данных компаний, вакансий, интервью вопросов и HR советов
"""

import json
import os
import sys
from datetime import datetime
from typing import Optional
import re

try:
    from anthropic import Anthropic
except ImportError:
    print("❌ Требуется установить anthropic SDK:")
    print("pip install anthropic")
    sys.exit(1)

# Initialize Anthropic client
client = Anthropic()

# System prompt for AI parser (from AI_PARSER_PROMPT.md)
PARSER_SYSTEM_PROMPT = """You are an expert data parser for Jarlyq, a job search platform for Central Asia (Kazakhstan, Kyrgyzstan, Uzbekistan).

Your task is to find and parse information about IT companies, job positions, interview questions, and HR advice from various sources on the internet.

You MUST:
1. Only parse REAL companies from CIS countries (KZ, KG, UZ)
2. Only IT companies or IT departments of larger companies
3. Return ONLY verified, factual information - NEVER make up data
4. Include source for every piece of information
5. Structure all data as JSON ready for database import
6. Be honest if you cannot find certain information - leave it null rather than fabricate

Return response ONLY as valid JSON with this exact structure:
{
  "companies": [
    {
      "name": "Company Name",
      "website": "https://...",
      "founded_year": 2015,
      "employee_count": "50-100",
      "industry": "SaaS",
      "description": "What the company does",
      "headquarters_city": "Almaty",
      "linkedin_url": "https://linkedin.com/company/...",
      "github_url": null,
      "hiring_now": true,
      "tech_stack": ["Python", "Go", "React"],
      "jobs": [
        {
          "title": "Junior Backend Developer",
          "level": "junior",
          "job_type": "full-time",
          "location": "Remote",
          "salary_min": 2000,
          "salary_max": 3500,
          "description": "Job description",
          "requirements": ["Python", "PostgreSQL"],
          "nice_to_have": ["Docker", "Kubernetes"],
          "soft_skills": ["Communication", "Problem solving"],
          "required_stacks": ["Python", "PostgreSQL"],
          "application_url": "https://..."
        }
      ],
      "interview_questions": [
        {
          "question": "Explain REST API",
          "answer_tips": "REST uses HTTP methods...",
          "category": "Technical",
          "difficulty": 2,
          "source": "reddit.com/r/cscareerquestions",
          "times_asked": 5,
          "success_rate": 80
        }
      ],
      "coding_tasks": [
        {
          "title": "Reverse a String",
          "description": "Write a function that reverses a string",
          "difficulty": 1,
          "language": "Python",
          "time_limit": 15,
          "expected_solution": "def reverse(s): return s[::-1]"
        }
      ],
      "hr_advice": [
        {
          "title": "What We Look For",
          "content": "We value communication and teamwork...",
          "category": "Culture",
          "hr_name": "John Doe",
          "source": "linkedin.com/posts/..."
        }
      ],
      "company_reviews": [
        {
          "rating": 4.5,
          "work_life_balance": 4,
          "salary_rating": 4,
          "growth_rating": 5,
          "culture_rating": 4,
          "benefits_rating": 4,
          "review_text": "Great place to work...",
          "employment_type": "current",
          "position": "Backend Developer",
          "source": "glassdoor.com"
        }
      ]
    }
  ],
  "metadata": {
    "total_companies": 1,
    "total_jobs": 0,
    "total_interview_questions": 0,
    "sources": ["source1.com", "source2.com"],
    "parsed_at": "2025-03-09T10:00:00Z"
  }
}

IMPORTANT: If you cannot find certain information, use null instead of making it up."""


def extract_json_from_response(response_text: str) -> dict:
    """Extract JSON from AI response, handling markdown code blocks"""
    try:
        # Try direct JSON parsing first
        return json.loads(response_text)
    except json.JSONDecodeError:
        pass

    # Try to extract JSON from markdown code block
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # Try to find JSON object in text
    match = re.search(r'\{.*\}', response_text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError("Could not extract valid JSON from response")


def parse_company(company_name: str, conversation_history: list = None) -> dict:
    """
    Use AI to parse and extract data about a company

    Args:
        company_name: Name of the company to parse
        conversation_history: Previous conversation messages for context

    Returns:
        Parsed company data as dict
    """
    if conversation_history is None:
        conversation_history = []

    print(f"\n🔍 Parsing company: {company_name}")
    print(f"📡 Sending request to Claude AI...")

    user_message = f"""Please find and parse all information about the IT company/organization: {company_name}

Focus on:
1. Company profile (founding year, size, industry, location)
2. Open job positions (if any)
3. Interview questions asked by this company (search reddit, habr, twitter)
4. HR advice or hiring philosophy (from LinkedIn posts, interviews, etc)
5. Coding/technical tasks used in interviews
6. Company reviews and ratings

Search sources include:
- Official website and /careers page
- LinkedIn company page
- HH.kz job postings
- GitHub careers (if applicable)
- Habr Career
- Reddit discussions (r/cscareerquestions, etc)
- Twitter posts from HR
- Glassdoor reviews (if available)

Return ONLY valid JSON. If you cannot find certain information, use null."""

    # Add to conversation history
    conversation_history.append({
        "role": "user",
        "content": user_message
    })

    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            system=PARSER_SYSTEM_PROMPT,
            messages=conversation_history
        )

        response_text = response.content[0].text
        conversation_history.append({
            "role": "assistant",
            "content": response_text
        })

        # Extract JSON from response
        parsed_data = extract_json_from_response(response_text)

        # Add timestamp
        if "metadata" in parsed_data:
            parsed_data["metadata"]["parsed_at"] = datetime.now().isoformat() + "Z"

        print(f"✅ Successfully parsed {company_name}")
        return parsed_data, conversation_history

    except Exception as e:
        print(f"❌ Error parsing {company_name}: {str(e)}")
        return None, conversation_history


def parse_multiple_companies(companies: list[str]) -> list[dict]:
    """
    Parse multiple companies in a conversation context

    Args:
        companies: List of company names to parse

    Returns:
        List of parsed company data
    """
    all_data = []
    conversation_history = []

    print(f"\n🚀 Starting to parse {len(companies)} companies...")
    print("=" * 60)

    for i, company_name in enumerate(companies, 1):
        print(f"\n[{i}/{len(companies)}] Processing: {company_name}")

        parsed_data, conversation_history = parse_company(company_name, conversation_history)

        if parsed_data:
            all_data.append(parsed_data)

            # Save intermediate results
            with open(f"parsed_{company_name.replace(' ', '_')}.json", "w", encoding="utf-8") as f:
                json.dump(parsed_data, f, ensure_ascii=False, indent=2)
            print(f"💾 Saved to: parsed_{company_name.replace(' ', '_')}.json")

    return all_data


def merge_companies_data(companies_list: list[dict]) -> dict:
    """Merge multiple parsed companies into one structure"""
    merged = {
        "companies": [],
        "metadata": {
            "total_companies": 0,
            "total_jobs": 0,
            "total_interview_questions": 0,
            "total_coding_tasks": 0,
            "sources": set(),
            "parsed_at": datetime.now().isoformat() + "Z"
        }
    }

    for company_data in companies_list:
        if not company_data or "companies" not in company_data:
            continue

        for company in company_data.get("companies", []):
            merged["companies"].append(company)
            merged["metadata"]["total_companies"] += 1
            merged["metadata"]["total_jobs"] += len(company.get("jobs", []))
            merged["metadata"]["total_interview_questions"] += len(company.get("interview_questions", []))
            merged["metadata"]["total_coding_tasks"] += len(company.get("coding_tasks", []))

        if "metadata" in company_data:
            merged["metadata"]["sources"].update(company_data["metadata"].get("sources", []))

    # Convert sources set to list
    merged["metadata"]["sources"] = list(merged["metadata"]["sources"])

    return merged


def save_results(data: dict, output_file: str = "parsed_companies.json"):
    """Save parsed data to JSON file"""
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\n✅ Saved all data to: {output_file}")
    print(f"📊 Statistics:")
    print(f"   - Companies: {data['metadata']['total_companies']}")
    print(f"   - Jobs: {data['metadata']['total_jobs']}")
    print(f"   - Interview Questions: {data['metadata']['total_interview_questions']}")
    print(f"   - Coding Tasks: {data['metadata']['total_coding_tasks']}")


def main():
    """Main function"""
    # Set API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ Error: ANTHROPIC_API_KEY environment variable not set")
        print("Set it with: export ANTHROPIC_API_KEY='sk-...'")
        sys.exit(1)

    # Companies to parse - TOP 10 HIGH-PRIORITY
    # For full list, see COMPANIES_TO_PARSE.md
    companies_to_parse = [
        "Kaspi Bank",
        "Kolesa Group",
        "Yandex Kazakhstan",
        "iMod Digital",
        "JUSAN Invest",
        "Halyk Bank",
        "Aknet Kyrgyzstan",
        "UZCARD Uzbekistan",
        "BTS Digital",
        "Tengri Tech",
        # For comprehensive parsing (40+ companies), see COMPANIES_TO_PARSE.md
    ]

    print("=" * 60)
    print("🤖 AI DATA PARSER FOR JARLYQ")
    print("=" * 60)
    print("API Key loaded: ✓")
    print(f"Companies to parse: {len(companies_to_parse)}")

    # Parse companies
    all_data = parse_multiple_companies(companies_to_parse)

    # Merge results
    merged_data = merge_companies_data(all_data)

    # Save results
    save_results(merged_data)

    return merged_data


if __name__ == "__main__":
    main()
