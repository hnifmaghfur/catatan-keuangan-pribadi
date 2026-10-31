-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    monthly_budget NUMERIC(15,2) DEFAULT 0,
    budget_start_day INT DEFAULT 1 CHECK (budget_start_day BETWEEN 1 AND 31),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '📦',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Budgets table (historical & current period budgets)
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    amount NUMERIC(15,2) NOT NULL,
    description TEXT DEFAULT '',
    source TEXT DEFAULT 'web' CHECK (source IN ('web', 'whatsapp')),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON budgets(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

-- Default categories seed function
CREATE OR REPLACE FUNCTION seed_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO categories (user_id, name, emoji) VALUES
        (p_user_id, 'Makan', '🍔'),
        (p_user_id, 'Transport', '🚗'),
        (p_user_id, 'Belanja', '🛒'),
        (p_user_id, 'Hiburan', '🎮'),
        (p_user_id, 'Tagihan', '📄'),
        (p_user_id, 'Lainnya', '📦')
    ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-seed default categories when a new user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM seed_default_categories(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_new_user_categories ON users;
CREATE TRIGGER trigger_new_user_categories
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on categories" ON categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on budgets" ON budgets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on transactions" ON transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow public access for now or user-based when using anon key in web demo
CREATE POLICY "Public read/write on users" ON users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write on categories" ON categories FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write on budgets" ON budgets FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write on transactions" ON transactions FOR ALL TO anon USING (true) WITH CHECK (true);
