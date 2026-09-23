-- ===========================================================================
-- Friendlie — seed data for interests & activities
-- Run AFTER schema.sql. Safe to re-run (uses upserts on slug).
-- ===========================================================================

insert into public.interests (slug, name, category, emoji) values
  ('weightlifting',    'Weightlifting',     'fitness',      '🏋️'),
  ('running',          'Running',           'fitness',      '🏃'),
  ('yoga',             'Yoga',              'wellness',     '🧘'),
  ('cycling',          'Cycling',           'fitness',      '🚴'),
  ('home-cooking',     'Home Cooking',      'food',         '🍳'),
  ('baking',           'Baking',            'food',         '🧁'),
  ('coffee',           'Coffee',            'food',         '☕'),
  ('vegan-food',       'Vegan Food',        'food',         '🥗'),
  ('live-music',       'Live Music',        'music',        '🎸'),
  ('vinyl-records',    'Vinyl Records',     'music',        '🎶'),
  ('singing',          'Singing',           'music',        '🎤'),
  ('video-games',      'Video Games',       'gaming',       '🎮'),
  ('board-games',      'Board Games',       'gaming',       '🎲'),
  ('tabletop-rpgs',    'Tabletop RPGs',     'gaming',       '🐉'),
  ('fiction',          'Fiction',           'books',        '📚'),
  ('non-fiction',      'Non-fiction',       'books',        '📖'),
  ('poetry',           'Poetry',            'books',        '✍️'),
  ('hiking',           'Hiking',            'outdoors',     '🥾'),
  ('camping',          'Camping',           'outdoors',     '🏕️'),
  ('gardening',        'Gardening',         'outdoors',     '🌱'),
  ('birdwatching',     'Birdwatching',      'outdoors',     '🐦'),
  ('painting',         'Painting',          'arts',         '🎨'),
  ('photography',      'Photography',       'arts',         '📷'),
  ('pottery',          'Pottery',           'arts',         '🏺'),
  ('film',             'Film & Cinema',     'arts',         '🎬'),
  ('animal-shelter',   'Animal Shelters',   'volunteering', '🐾'),
  ('food-bank',        'Food Banks',        'volunteering', '🥫'),
  ('community-cleanup','Community Cleanups','volunteering', '🧹'),
  ('basketball',       'Basketball',        'sports',       '🏀'),
  ('soccer',           'Soccer',            'sports',       '⚽'),
  ('tennis',           'Tennis',            'sports',       '🎾'),
  ('climbing',         'Climbing',          'sports',       '🧗'),
  ('coding',           'Coding',            'tech',         '💻'),
  ('startups',         'Startups',          'tech',         '🚀'),
  ('ai-ml',            'AI & ML',           'tech',         '🤖'),
  ('new-parents',      'New Parents',       'parenting',    '🍼'),
  ('toddler-playdates','Toddler Playdates', 'parenting',    '🧸'),
  ('dogs',             'Dogs',              'pets',         '🐕'),
  ('cats',             'Cats',              'pets',         '🐈'),
  ('backpacking',      'Backpacking',       'travel',       '🎒'),
  ('road-trips',       'Road Trips',        'travel',       '🚗'),
  ('languages',        'Languages',         'travel',       '🗣️'),
  ('meditation',       'Meditation',        'wellness',     '🌬️')
on conflict (slug) do update
  set name = excluded.name, category = excluded.category, emoji = excluded.emoji;

insert into public.activities (slug, name, category, emoji) values
  ('morning-run',       'Morning Run',          'fitness',      '🏃'),
  ('coffee-walk',       'Coffee Walk',          'food',         '☕'),
  ('board-games',       'Board Game Night',     'gaming',       '🎲'),
  ('cooking-together',  'Cooking Together',     'food',         '🍳'),
  ('live-music',        'Live Music Outing',    'music',        '🎸'),
  ('museum-visit',      'Museum Visit',         'arts',         '🖼️'),
  ('hiking',            'Group Hike',           'outdoors',     '🥾'),
  ('book-club',         'Book Club',            'books',        '📚'),
  ('potluck',           'Potluck',              'food',         '🍲'),
  ('cycling',           'Weekend Cycle',        'fitness',      '🚴'),
  ('volunteering',      'Volunteering',         'volunteering', '🤝'),
  ('yoga',              'Yoga Class',           'wellness',     '🧘'),
  ('photography-walk',  'Photography Walk',     'arts',         '📷'),
  ('farmers-market',    'Farmers'' Market',     'food',         '🥕'),
  ('trivia-night',      'Trivia Night',         'gaming',       '🧠'),
  ('dog-walk',          'Dog Walk',             'pets',         '🐕'),
  ('rock-climbing',     'Rock Climbing',        'sports',       '🧗'),
  ('pickup-basketball', 'Pickup Basketball',    'sports',       '🏀'),
  ('language-exchange', 'Language Exchange',    'travel',       '🗣️'),
  ('coworking',         'Casual Coworking',     'tech',         '💻'),
  ('playground-meetup', 'Playground Meetup',    'parenting',    '🛝'),
  ('gallery-opening',   'Gallery Opening',      'arts',         '🎨')
on conflict (slug) do update
  set name = excluded.name, category = excluded.category, emoji = excluded.emoji;

-- ===========================================================================
-- game_prompts — "This or That" prompt bank for the async matchup game
-- ===========================================================================
insert into public.game_prompts (slug, option_a, option_b, emoji_a, emoji_b, category) values
  ('beach-mountains',      'Beach day',            'Mountain hike',        '🏖️', '⛰️', 'outdoors'),
  ('coffee-tea',           'Coffee',               'Tea',                  '☕', '🍵', 'food'),
  ('early-night-owl',      'Early riser',          'Night owl',            '🌅', '🌙', null),
  ('planner-spontaneous',  'Plan every detail',    'Wing it',              '🗒️', '🎲', null),
  ('movie-book',           'Movie night',          'Book night',           '🎬', '📚', 'arts'),
  ('city-nature',          'City weekend',         'Nature getaway',       '🏙️', '🌲', 'travel'),
  ('cook-order',           'Cook at home',         'Order takeout',        '🍳', '🥡', 'food'),
  ('gym-outdoors',         'Gym workout',          'Outdoor workout',      '🏋️', '🏃', 'fitness'),
  ('solo-group',           'Solo hangout',         'Group hangout',        '🧑', '👥', null),
  ('dogs-cats',            'Dog person',           'Cat person',           '🐕', '🐈', 'pets'),
  ('sweet-savory',         'Sweet snacks',         'Savory snacks',        '🍩', '🥨', 'food'),
  ('board-video-games',    'Board games',          'Video games',         '🎲', '🎮', 'gaming'),
  ('podcast-music',        'Podcasts',             'Music',                '🎙️', '🎵', 'music'),
  ('road-trip-flight',     'Road trip',            'Flying',               '🚗', '✈️', 'travel'),
  ('texts-calls',          'Text to chat',         'Call to chat',         '💬', '📞', null),
  ('summer-winter',        'Summer',               'Winter',               '☀️', '❄️', null),
  ('museum-concert',       'Museum visit',         'Live concert',         '🖼️', '🎤', 'arts'),
  ('routine-adventure',    'Cozy routine',         'New adventure',        '🛋️', '🧭', null),
  ('sunrise-sunset',       'Watch a sunrise',      'Watch a sunset',       '🌄', '🌇', 'outdoors'),
  ('team-sport-solo',      'Team sports',          'Solo sports',          '🏀', '🏃', 'sports'),
  ('camping-hotel',        'Camping',              'Hotel stay',           '🏕️', '🏨', 'outdoors'),
  ('trivia-charades',      'Trivia night',         'Charades night',       '🧠', '🎭', 'gaming'),
  ('baking-grilling',      'Baking',               'Grilling',             '🧁', '🍖', 'food'),
  ('quiet-cafe-loud-bar',  'Quiet cafe',           'Loud bar',             '☕', '🍻', null)
on conflict (slug) do update
  set option_a = excluded.option_a, option_b = excluded.option_b,
      emoji_a = excluded.emoji_a, emoji_b = excluded.emoji_b, category = excluded.category;
