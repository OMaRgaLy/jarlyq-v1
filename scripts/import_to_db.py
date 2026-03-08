#!/usr/bin/env python3
"""
Database Importer for Jarlyq
Loads parsed company data from JSON into PostgreSQL database
"""

import json
import os
import sys
from datetime import datetime

try:
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print("Install psycopg2: pip install psycopg2-binary")
    sys.exit(1)


def get_db_connection():
    """Connect to PostgreSQL using environment variables or defaults"""
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        dbname=os.getenv("DB_NAME", "jarlyq"),
        user=os.getenv("DB_USER", "jarlyq"),
        password=os.getenv("DB_PASSWORD", "jarlyq"),
    )


def import_company(cursor, company_data: dict) -> int:
    """Import a single company and return its company_profile ID"""

    # 1. Insert into companies table (base company)
    cursor.execute(
        """
        INSERT INTO companies (name, description, website, created_at, updated_at)
        VALUES (%s, %s, %s, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET
            description = EXCLUDED.description,
            website = EXCLUDED.website,
            updated_at = NOW()
        RETURNING id
        """,
        (
            company_data.get("name", "Unknown"),
            company_data.get("description", ""),
            company_data.get("website", ""),
        ),
    )
    company_id = cursor.fetchone()[0]

    # 2. Insert/update company profile
    cursor.execute(
        """
        INSERT INTO company_profiles (
            company_id, logo_url, headquarters_city, employee_count,
            founded_year, industry, hiring_now, linkedin_url, github_url,
            created_at, updated_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        ON CONFLICT (company_id) DO UPDATE SET
            logo_url = EXCLUDED.logo_url,
            headquarters_city = EXCLUDED.headquarters_city,
            employee_count = EXCLUDED.employee_count,
            founded_year = EXCLUDED.founded_year,
            industry = EXCLUDED.industry,
            hiring_now = EXCLUDED.hiring_now,
            linkedin_url = EXCLUDED.linkedin_url,
            github_url = EXCLUDED.github_url,
            updated_at = NOW()
        RETURNING id
        """,
        (
            company_id,
            company_data.get("logo_url"),
            company_data.get("headquarters_city", ""),
            company_data.get("employee_count", ""),
            company_data.get("founded_year"),
            company_data.get("industry", ""),
            company_data.get("hiring_now", False),
            company_data.get("linkedin_url"),
            company_data.get("github_url"),
        ),
    )
    profile_id = cursor.fetchone()[0]

    # 3. Insert tech stacks
    for stack_name in company_data.get("tech_stack", []):
        cursor.execute(
            """
            INSERT INTO stacks (name, created_at, updated_at)
            VALUES (%s, NOW(), NOW())
            ON CONFLICT (name) DO NOTHING
            RETURNING id
            """,
            (stack_name,),
        )
        row = cursor.fetchone()
        if row:
            stack_id = row[0]
        else:
            cursor.execute("SELECT id FROM stacks WHERE name = %s", (stack_name,))
            stack_id = cursor.fetchone()[0]

        # Link company to stack (many-to-many)
        cursor.execute(
            """
            INSERT INTO company_stacks (company_profile_id, stack_id)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
            """,
            (profile_id, stack_id),
        )

    # 4. Insert jobs
    for job in company_data.get("jobs", []):
        cursor.execute(
            """
            INSERT INTO jobs (
                company_profile_id, title, level, job_type, location,
                salary_min, salary_max, description, application_url,
                created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            RETURNING id
            """,
            (
                profile_id,
                job.get("title", ""),
                job.get("level", ""),
                job.get("job_type", "full-time"),
                job.get("location", ""),
                job.get("salary_min"),
                job.get("salary_max"),
                job.get("description", ""),
                job.get("application_url"),
            ),
        )
        job_id = cursor.fetchone()[0]

        # Link job to required stacks
        for stack_name in job.get("required_stacks", []) + job.get("requirements", []):
            cursor.execute(
                """
                INSERT INTO stacks (name, created_at, updated_at)
                VALUES (%s, NOW(), NOW())
                ON CONFLICT (name) DO NOTHING
                """,
                (stack_name,),
            )
            cursor.execute("SELECT id FROM stacks WHERE name = %s", (stack_name,))
            row = cursor.fetchone()
            if row:
                cursor.execute(
                    """
                    INSERT INTO job_stacks (job_id, stack_id)
                    VALUES (%s, %s)
                    ON CONFLICT DO NOTHING
                    """,
                    (job_id, row[0]),
                )

    # 5. Insert interview questions
    for q in company_data.get("interview_questions", []):
        cursor.execute(
            """
            INSERT INTO job_interview_questions (
                company_profile_id, question, answer_tips, category,
                difficulty, source, times_asked, success_rate,
                created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """,
            (
                profile_id,
                q.get("question", ""),
                q.get("answer_tips", ""),
                q.get("category", "Technical"),
                q.get("difficulty", 1),
                q.get("source", ""),
                q.get("times_asked", 1),
                q.get("success_rate"),
            ),
        )

    # 6. Insert company reviews
    for review in company_data.get("company_reviews", []):
        cursor.execute(
            """
            INSERT INTO company_reviews (
                company_profile_id, rating, work_life_balance, salary_rating,
                growth_rating, culture_rating, benefits_rating,
                review_text, employment_type, position, source,
                created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """,
            (
                profile_id,
                review.get("rating", 0),
                review.get("work_life_balance", 0),
                review.get("salary_rating", 0),
                review.get("growth_rating", 0),
                review.get("culture_rating", 0),
                review.get("benefits_rating", 0),
                review.get("review_text", ""),
                review.get("employment_type", ""),
                review.get("position", ""),
                review.get("source", ""),
            ),
        )

    # 7. Insert HR advice
    for advice in company_data.get("hr_advice", []):
        cursor.execute(
            """
            INSERT INTO hr_advices (
                company_profile_id, title, content, category,
                hr_name, source, created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
            """,
            (
                profile_id,
                advice.get("title", ""),
                advice.get("content", ""),
                advice.get("category", ""),
                advice.get("hr_name", ""),
                advice.get("source", ""),
            ),
        )

    # 8. Insert coding tasks
    for task in company_data.get("coding_tasks", []):
        cursor.execute(
            """
            INSERT INTO coding_tasks (
                company_profile_id, title, description, difficulty,
                language, time_limit, expected_solution,
                created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """,
            (
                profile_id,
                task.get("title", ""),
                task.get("description", ""),
                task.get("difficulty", 1),
                task.get("language", ""),
                task.get("time_limit"),
                task.get("expected_solution", ""),
            ),
        )

    return profile_id


def import_all(json_file: str):
    """Import all companies from parsed JSON file"""
    print(f"\nLoading data from: {json_file}")

    with open(json_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    companies = data.get("companies", [])
    if not companies:
        print("No companies found in JSON file!")
        return

    print(f"Found {len(companies)} companies to import")

    conn = get_db_connection()
    cursor = conn.cursor()

    imported = 0
    failed = 0

    for company in companies:
        try:
            name = company.get("name", "Unknown")
            print(f"  Importing: {name}...", end=" ")
            profile_id = import_company(cursor, company)
            conn.commit()
            print(f"OK (profile_id={profile_id})")
            imported += 1
        except Exception as e:
            conn.rollback()
            print(f"FAILED: {e}")
            failed += 1

    cursor.close()
    conn.close()

    print(f"\nImport complete!")
    print(f"  Imported: {imported}")
    print(f"  Failed: {failed}")
    print(f"  Total: {len(companies)}")


def main():
    json_file = sys.argv[1] if len(sys.argv) > 1 else "parsed_companies.json"

    if not os.path.exists(json_file):
        print(f"File not found: {json_file}")
        print("Usage: python scripts/import_to_db.py [path/to/parsed_companies.json]")
        sys.exit(1)

    import_all(json_file)


if __name__ == "__main__":
    main()
