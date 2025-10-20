CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(120) NOT NULL,
    last_name VARCHAR(120) NOT NULL,
    birth_date DATE NULL,
    phone VARCHAR(50),
    telegram VARCHAR(100),
    bio VARCHAR(255),
    theme VARCHAR(20) DEFAULT 'light',
    email_verified BOOLEAN DEFAULT FALSE,
    privacy_phone_private BOOLEAN DEFAULT FALSE,
    privacy_telegram_private BOOLEAN DEFAULT FALSE,
    privacy_email_private BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge VARCHAR(100) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS stacks (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(120) UNIQUE NOT NULL,
    popularity INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    cover_url VARCHAR(512),
    description TEXT,
    tools VARCHAR(255),
    widget_training_enabled BOOLEAN DEFAULT FALSE,
    widget_internship_enabled BOOLEAN DEFAULT FALSE,
    widget_vacancy_enabled BOOLEAN DEFAULT FALSE,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(100),
    contact_telegram VARCHAR(100),
    contact_website VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS company_stacks (
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    stack_id INTEGER NOT NULL REFERENCES stacks(id) ON DELETE CASCADE,
    PRIMARY KEY (company_id, stack_id)
);

CREATE TABLE IF NOT EXISTS company_regions (
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    PRIMARY KEY (company_id, region_id)
);

CREATE TABLE IF NOT EXISTS opportunities (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT,
    apply_url VARCHAR(512),
    level VARCHAR(50),
    start_date DATE,
    end_date DATE
);

CREATE TABLE IF NOT EXISTS opportunity_stacks (
    opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    stack_id INTEGER NOT NULL REFERENCES stacks(id) ON DELETE CASCADE,
    PRIMARY KEY (opportunity_id, stack_id)
);

CREATE TABLE IF NOT EXISTS opportunity_regions (
    opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    PRIMARY KEY (opportunity_id, region_id)
);

CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    cover_url VARCHAR(512),
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(100),
    contact_telegram VARCHAR(100),
    contact_website VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    program TEXT,
    external_url VARCHAR(512)
);

CREATE TABLE IF NOT EXISTS course_stacks (
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    stack_id INTEGER NOT NULL REFERENCES stacks(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, stack_id)
);

CREATE TABLE IF NOT EXISTS course_regions (
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, region_id)
);

CREATE TABLE IF NOT EXISTS certificates (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    code VARCHAR(64) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL,
    issuer_type VARCHAR(50) NOT NULL,
    issuer_name VARCHAR(255) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    issued_date DATE NOT NULL,
    expiry_date DATE,
    metadata TEXT
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
