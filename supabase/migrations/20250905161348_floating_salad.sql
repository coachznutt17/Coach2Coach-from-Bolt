/*
  # Create Messaging and Discussion System

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `participant_ids` (uuid array)
      - `title` (text, optional for group chats)
      - `type` (text: 'direct' or 'group')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations)
      - `sender_id` (uuid, references auth.users)
      - `content` (text)
      - `message_type` (text: 'text', 'file', 'resource_share')
      - `file_url` (text, optional)
      - `resource_id` (uuid, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `discussion_boards`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `sport` (text, optional)
      - `level` (text, optional)
      - `created_by` (uuid, references auth.users)
      - `is_pinned` (boolean)
      - `is_locked` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `discussion_posts`
      - `id` (uuid, primary key)
      - `board_id` (uuid, references discussion_boards)
      - `author_id` (uuid, references auth.users)
      - `title` (text)
      - `content` (text)
      - `post_type` (text: 'question', 'discussion', 'resource_share')
      - `resource_id` (uuid, optional)
      - `upvotes` (integer)
      - `downvotes` (integer)
      - `reply_count` (integer)
      - `is_pinned` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `discussion_replies`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references discussion_posts)
      - `author_id` (uuid, references auth.users)
      - `content` (text)
      - `parent_reply_id` (uuid, optional for nested replies)
      - `upvotes` (integer)
      - `downvotes` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Conversation participants can read/write messages
    - Public read access for discussion boards
    - Authors can edit their own posts/replies
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids uuid[] NOT NULL,
  title text DEFAULT '',
  type text DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'resource_share')),
  file_url text DEFAULT '',
  resource_id uuid DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create discussion_boards table
CREATE TABLE IF NOT EXISTS discussion_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  sport text DEFAULT '',
  level text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  post_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create discussion_posts table
CREATE TABLE IF NOT EXISTS discussion_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid REFERENCES discussion_boards(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  post_type text DEFAULT 'discussion' CHECK (post_type IN ('question', 'discussion', 'resource_share')),
  resource_id uuid DEFAULT NULL,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  reply_count integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create discussion_replies table
CREATE TABLE IF NOT EXISTS discussion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES discussion_posts(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  parent_reply_id uuid REFERENCES discussion_replies(id) ON DELETE CASCADE DEFAULT NULL,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Users can read conversations they participate in"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = ANY(participant_ids));

CREATE POLICY "Participants can update conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = ANY(participant_ids))
  WITH CHECK (auth.uid() = ANY(participant_ids));

-- Policies for messages
CREATE POLICY "Users can read messages in their conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE auth.uid() = ANY(participant_ids)
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations WHERE auth.uid() = ANY(participant_ids)
    )
  );

-- Policies for discussion_boards
CREATE POLICY "Anyone can read discussion boards"
  ON discussion_boards
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create discussion boards"
  ON discussion_boards
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Board creators can update their boards"
  ON discussion_boards
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Policies for discussion_posts
CREATE POLICY "Anyone can read discussion posts"
  ON discussion_posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON discussion_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update their own posts"
  ON discussion_posts
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Policies for discussion_replies
CREATE POLICY "Anyone can read discussion replies"
  ON discussion_replies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create replies"
  ON discussion_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update their own replies"
  ON discussion_replies
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN(participant_ids);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_discussion_boards_category ON discussion_boards(category);
CREATE INDEX IF NOT EXISTS idx_discussion_boards_sport ON discussion_boards(sport);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_board_id ON discussion_posts(board_id);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_author_id ON discussion_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_post_id ON discussion_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_author_id ON discussion_replies(author_id);

-- Create triggers for updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussion_boards_updated_at
  BEFORE UPDATE ON discussion_boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussion_posts_updated_at
  BEFORE UPDATE ON discussion_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussion_replies_updated_at
  BEFORE UPDATE ON discussion_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update reply count when replies are added/removed
CREATE OR REPLACE FUNCTION update_post_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE discussion_posts 
    SET reply_count = reply_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE discussion_posts 
    SET reply_count = reply_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reply count
CREATE TRIGGER update_reply_count_trigger
  AFTER INSERT OR DELETE ON discussion_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_post_reply_count();

-- Function to update board post count
CREATE OR REPLACE FUNCTION update_board_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE discussion_boards 
    SET post_count = post_count + 1 
    WHERE id = NEW.board_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE discussion_boards 
    SET post_count = post_count - 1 
    WHERE id = OLD.board_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for board post count
CREATE TRIGGER update_board_post_count_trigger
  AFTER INSERT OR DELETE ON discussion_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_board_post_count();