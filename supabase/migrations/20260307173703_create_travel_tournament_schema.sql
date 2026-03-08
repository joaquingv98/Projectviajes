/*
  # Travel Tournament Schema

  ## Overview
  Creates a complete database schema for a tournament-style travel voting app
  inspired by Champions League brackets.

  ## New Tables
  
  ### `tournaments`
  - `id` (uuid, primary key) - Unique tournament identifier
  - `name` (text) - Tournament name
  - `num_participants` (integer) - Number of participants (2, 4, or 8)
  - `participants` (jsonb) - Array of participant names
  - `status` (text) - Tournament status: 'setup', 'in_progress', 'completed'
  - `winner_proposal_id` (uuid, nullable) - Reference to winning proposal
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `matches`
  - `id` (uuid, primary key) - Unique match identifier
  - `tournament_id` (uuid, foreign key) - Reference to tournament
  - `round` (text) - Round name: 'quarterfinals', 'semifinals', 'final'
  - `match_number` (integer) - Match position in round
  - `player1_name` (text) - First participant name
  - `player2_name` (text, nullable) - Second participant name (null if waiting for previous round)
  - `status` (text) - Match status: 'pending', 'proposing', 'voting', 'completed'
  - `winner_name` (text, nullable) - Name of winner
  - `voting_ends_at` (timestamptz, nullable) - When voting period ends
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `proposals`
  - `id` (uuid, primary key) - Unique proposal identifier
  - `match_id` (uuid, foreign key) - Reference to match
  - `player_name` (text) - Name of player who submitted
  - `flight_link` (text) - URL to flight booking
  - `price` (numeric) - Price in euros
  - `destination` (text, nullable) - Destination city/country
  - `dates` (text, nullable) - Travel dates
  - `created_at` (timestamptz) - Creation timestamp

  ### `votes`
  - `id` (uuid, primary key) - Unique vote identifier
  - `match_id` (uuid, foreign key) - Reference to match
  - `voter_name` (text) - Name of person voting
  - `proposal_id` (uuid, foreign key) - Reference to chosen proposal
  - `created_at` (timestamptz) - Creation timestamp
  - Unique constraint on (match_id, voter_name) - One vote per person per match

  ## Security
  - Enable RLS on all tables
  - Public access policies for MVP (TODO: add proper auth later)
*/

-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Travel Tournament',
  num_participants integer NOT NULL CHECK (num_participants IN (2, 4, 8)),
  participants jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'in_progress', 'completed')),
  winner_proposal_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round text NOT NULL CHECK (round IN ('quarterfinals', 'semifinals', 'final')),
  match_number integer NOT NULL,
  player1_name text NOT NULL,
  player2_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'proposing', 'voting', 'completed')),
  winner_name text,
  voting_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  flight_link text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  destination text,
  dates text,
  created_at timestamptz DEFAULT now()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  voter_name text NOT NULL,
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(match_id, voter_name)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_proposals_match ON proposals(match_id);
CREATE INDEX IF NOT EXISTS idx_votes_match ON votes(match_id);
CREATE INDEX IF NOT EXISTS idx_votes_proposal ON votes(proposal_id);

-- Enable Row Level Security
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Public access policies for MVP (TODO: add proper authentication)
CREATE POLICY "Public can view tournaments"
  ON tournaments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create tournaments"
  ON tournaments FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update tournaments"
  ON tournaments FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view matches"
  ON matches FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create matches"
  ON matches FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update matches"
  ON matches FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view proposals"
  ON proposals FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create proposals"
  ON proposals FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can view votes"
  ON votes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create votes"
  ON votes FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update votes"
  ON votes FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);