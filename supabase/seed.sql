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

-- ===========================================================================
-- trivia_questions — light, friendly question bank for the live Trivia Duel
-- ===========================================================================
insert into public.trivia_questions (slug, question, option_a, option_b, option_c, option_d, correct_option, category) values
  ('planet-largest',      'Which planet in our solar system is the largest?',            'Saturn',            'Jupiter',           'Neptune',            'Earth',             'b', null),
  ('octopus-hearts',      'How many hearts does an octopus have?',                        'One',               'Two',               'Three',              'Four',              'c', 'pets'),
  ('pizza-origin',        'Which country is widely credited with inventing pizza as we know it?', 'Greece',    'France',            'Italy',              'Spain',             'c', 'food'),
  ('great-wall-visible',  'Can the Great Wall of China actually be seen from space with the naked eye?', 'Yes, easily', 'No, that''s a myth', 'Only at night',     'Only from the Moon', 'b', 'travel'),
  ('honey-spoilage',      'Under proper storage, how long can honey last before spoiling?', 'A few months',      'About a year',      'A few years',        'Essentially forever', 'd', 'food'),
  ('shakespeare-plays',   'About how many plays did William Shakespeare write?',          'Around 12',         'Around 39',         'Around 75',          'Around 120',        'b', 'books'),
  ('bike-invention',      'In which century was the modern bicycle invented?',            '17th century',      '18th century',      '19th century',       '20th century',      'c', null),
  ('longest-river',       'Which river is generally considered the longest in the world?', 'Amazon River',      'Nile River',        'Yangtze River',      'Mississippi River', 'b', 'travel'),
  ('board-game-oldest',   'Which of these board games is the oldest?',                    'Monopoly',          'Chess',             'Scrabble',           'Sorry!',            'b', 'gaming'),
  ('coffee-berry',        'Coffee beans are actually the seeds of what kind of fruit?',   'A nut',             'A berry',           'A root',             'A flower',          'b', 'food'),
  ('moon-landing-year',   'In what year did humans first land on the Moon?',              '1965',              '1969',              '1972',               '1975',              'b', null),
  ('video-game-oldest',   'Which of these is considered one of the earliest video games?', 'Pong',             'Tetris',            'Pac-Man',            'Super Mario Bros.', 'a', 'gaming'),
  ('sahara-size',         'The Sahara Desert is roughly the same size as which of these?', 'India',             'The United States', 'Australia',          'Brazil',            'b', 'travel'),
  ('guitar-strings',      'How many strings does a standard acoustic guitar have?',       'Four',              'Five',              'Six',                'Seven',             'c', 'music'),
  ('tomato-classification', 'Botanically speaking, a tomato is technically a...',         'Vegetable',         'Fruit',             'Legume',            'Root',              'b', 'food'),
  ('fastest-land-animal', 'What is the fastest land animal?',                             'Lion',              'Greyhound',         'Cheetah',            'Pronghorn antelope', 'c', 'pets'),
  ('painting-mona-lisa',  'Who painted the Mona Lisa?',                                   'Michelangelo',      'Leonardo da Vinci', 'Raphael',            'Donatello',         'b', 'arts'),
  ('country-most-time-zones', 'Which country spans the most time zones?',                'Russia',            'USA',               'France',             'China',             'c', 'travel'),
  ('html-meaning',        'What does "HTML" stand for?',                                  'Hyper Trainer Marking Language', 'HyperText Markup Language', 'HighText Machine Language', 'Hyperlink Text Markup Language', 'b', 'tech'),
  ('bee-species',         'Roughly how many species of bees are there worldwide?',        'About 200',         'About 2,000',       'About 20,000',       'About 200,000',     'c', 'outdoors'),
  ('basketball-invented', 'In which country was basketball invented?',                    'United States',     'Canada',            'United Kingdom',     'Australia',         'a', 'sports'),
  ('penguins-fly',        'How many penguin species can fly?',                            'None',              'One',               'A few',              'All of them',       'a', 'pets'),
  ('longest-marathon-distance', 'What is the standard distance of a marathon?',           '21.1 km',           '26.2 miles',        '30 miles',           '40 km',             'b', 'fitness'),
  ('emoji-year',          'In what decade were emoji first created in Japan?',            '1980s',             '1990s',             '2000s',              '2010s',             'b', 'tech')
on conflict (slug) do update
  set question = excluded.question, option_a = excluded.option_a, option_b = excluded.option_b,
      option_c = excluded.option_c, option_d = excluded.option_d,
      correct_option = excluded.correct_option, category = excluded.category;
