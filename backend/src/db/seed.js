require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('./connection');

// ─────────────────────────────────────────────────
//  SEED DATA
// ─────────────────────────────────────────────────

const categories = [
  { name: 'Science',     description: 'Biology, Chemistry, Physics and Astronomy', icon_name: 'flask' },
  { name: 'History',     description: 'World, American and Ancient History',        icon_name: 'landmark' },
  { name: 'Sports',      description: 'Football, Basketball, Tennis and Olympics',  icon_name: 'trophy' },
  { name: 'Technology',  description: 'Computers, Programming, Internet and Gadgets', icon_name: 'cpu' },
  { name: 'Pop Culture', description: 'Movies, Music, TV Shows and Celebrity',      icon_name: 'star' },
];

// questions[categoryIndex] = array of { question_text, option_a, option_b, option_c, option_d, correct_option, difficulty }
const questionsByCat = [
  // ── SCIENCE (index 0) ──
  [
    // EASY (5)
    { question_text: 'What is the chemical symbol for water?', option_a: 'WA', option_b: 'H2O', option_c: 'HO2', option_d: 'W2O', correct_option: 'b', difficulty: 'easy' },
    { question_text: 'How many bones are in the adult human body?', option_a: '186', option_b: '212', option_c: '206', option_d: '198', correct_option: 'c', difficulty: 'easy' },
    { question_text: 'What planet is known as the Red Planet?', option_a: 'Venus', option_b: 'Jupiter', option_c: 'Saturn', option_d: 'Mars', correct_option: 'd', difficulty: 'easy' },
    { question_text: 'What gas do plants absorb from the atmosphere?', option_a: 'Oxygen', option_b: 'Nitrogen', option_c: 'Carbon Dioxide', option_d: 'Hydrogen', correct_option: 'c', difficulty: 'easy' },
    { question_text: 'What is the hardest natural substance on Earth?', option_a: 'Iron', option_b: 'Diamond', option_c: 'Quartz', option_d: 'Titanium', correct_option: 'b', difficulty: 'easy' },
    // MEDIUM (10)
    { question_text: 'What is the speed of light in a vacuum (approx)?', option_a: '150,000 km/s', option_b: '300,000 km/s', option_c: '450,000 km/s', option_d: '250,000 km/s', correct_option: 'b', difficulty: 'medium' },
    { question_text: 'Which element has the atomic number 79?', option_a: 'Silver', option_b: 'Platinum', option_c: 'Gold', option_d: 'Copper', correct_option: 'c', difficulty: 'medium' },
    { question_text: 'What organ produces insulin?', option_a: 'Liver', option_b: 'Kidney', option_c: 'Pancreas', option_d: 'Spleen', correct_option: 'c', difficulty: 'medium' },
    { question_text: 'What is the most abundant gas in Earth\'s atmosphere?', option_a: 'Oxygen', option_b: 'Carbon Dioxide', option_c: 'Argon', option_d: 'Nitrogen', correct_option: 'd', difficulty: 'medium' },
    { question_text: 'Which force keeps planets in orbit around the sun?', option_a: 'Magnetic force', option_b: 'Gravity', option_c: 'Nuclear force', option_d: 'Centrifugal force', correct_option: 'b', difficulty: 'medium' },
    { question_text: 'DNA stands for which of the following?', option_a: 'Deoxyribonucleic Acid', option_b: 'Dinitrogen Acid', option_c: 'Deoxyribose Nitrogen Acid', option_d: 'Dynamic Nucleic Acid', correct_option: 'a', difficulty: 'medium' },
    { question_text: 'How many chambers does the human heart have?', option_a: '2', option_b: '3', option_c: '4', option_d: '6', correct_option: 'c', difficulty: 'medium' },
    { question_text: 'What is the chemical formula for table salt?', option_a: 'KCl', option_b: 'NaCl', option_c: 'CaCl2', option_d: 'MgCl2', correct_option: 'b', difficulty: 'medium' },
    { question_text: 'Which planet has the most moons?', option_a: 'Jupiter', option_b: 'Saturn', option_c: 'Uranus', option_d: 'Neptune', correct_option: 'b', difficulty: 'medium' },
    { question_text: 'What type of bond holds water molecules together?', option_a: 'Covalent', option_b: 'Ionic', option_c: 'Metallic', option_d: 'Hydrogen', correct_option: 'a', difficulty: 'medium' },
    // HARD (5)
    { question_text: 'What is the Heisenberg Uncertainty Principle about?', option_a: 'Speed of sound', option_b: 'Position and momentum cannot both be known precisely', option_c: 'Energy conservation', option_d: 'Wave frequency', correct_option: 'b', difficulty: 'hard' },
    { question_text: 'Which scientist proposed the theory of general relativity?', option_a: 'Isaac Newton', option_b: 'Niels Bohr', option_c: 'Albert Einstein', option_d: 'Max Planck', correct_option: 'c', difficulty: 'hard' },
    { question_text: 'What is the half-life of Carbon-14?', option_a: '1,570 years', option_b: '5,730 years', option_c: '10,200 years', option_d: '3,400 years', correct_option: 'b', difficulty: 'hard' },
    { question_text: 'Which particle is responsible for carrying the electromagnetic force?', option_a: 'Graviton', option_b: 'Gluon', option_c: 'Photon', option_d: 'W boson', correct_option: 'c', difficulty: 'hard' },
    { question_text: 'What is the Chandrasekhar limit?', option_a: 'Max speed of a neutron star', option_b: 'Maximum mass of a white dwarf (~1.4 solar masses)', option_c: 'Minimum mass for nuclear fusion', option_d: 'Radius of a black hole', correct_option: 'b', difficulty: 'hard' },
  ],

  // ── HISTORY (index 1) ──
  [
    // EASY (5)
    { question_text: 'Who was the first President of the United States?', option_a: 'John Adams', option_b: 'Thomas Jefferson', option_c: 'George Washington', option_d: 'Benjamin Franklin', correct_option: 'c', difficulty: 'easy' },
    { question_text: 'In which year did World War II end?', option_a: '1943', option_b: '1944', option_c: '1946', option_d: '1945', correct_option: 'd', difficulty: 'easy' },
    { question_text: 'Which ancient wonder of the world was located in Alexandria?', option_a: 'Colossus of Rhodes', option_b: 'Lighthouse of Alexandria', option_c: 'Hanging Gardens', option_d: 'Statue of Zeus', correct_option: 'b', difficulty: 'easy' },
    { question_text: 'What empire was ruled by Julius Caesar?', option_a: 'Greek Empire', option_b: 'Ottoman Empire', option_c: 'Roman Empire', option_d: 'Byzantine Empire', correct_option: 'c', difficulty: 'easy' },
    { question_text: 'The Berlin Wall fell in which year?', option_a: '1987', option_b: '1991', option_c: '1989', option_d: '1985', correct_option: 'c', difficulty: 'easy' },
    // MEDIUM (10)
    { question_text: 'Who wrote the "I Have a Dream" speech?', option_a: 'Malcolm X', option_b: 'Martin Luther King Jr.', option_c: 'Barack Obama', option_d: 'Frederick Douglass', correct_option: 'b', difficulty: 'medium' },
    { question_text: 'What year did the French Revolution begin?', option_a: '1776', option_b: '1804', option_c: '1789', option_d: '1815', correct_option: 'c', difficulty: 'medium' },
    { question_text: 'Which country was the first to grant women the right to vote?', option_a: 'USA', option_b: 'United Kingdom', option_c: 'Australia', option_d: 'New Zealand', correct_option: 'd', difficulty: 'medium' },
    { question_text: 'The Magna Carta was signed in which year?', option_a: '1215', option_b: '1066', option_c: '1348', option_d: '1455', correct_option: 'a', difficulty: 'medium' },
    { question_text: 'Who was the last Pharaoh of Ancient Egypt?', option_a: 'Nefertiti', option_b: 'Cleopatra VII', option_c: 'Hatshepsut', option_d: 'Ramesses II', correct_option: 'b', difficulty: 'medium' },
    { question_text: 'The Cold War was primarily between which two superpowers?', option_a: 'USA and China', option_b: 'UK and USSR', option_c: 'USA and USSR', option_d: 'USA and Germany', correct_option: 'c', difficulty: 'medium' },
    { question_text: 'Which battle ended Napoleon\'s rule?', option_a: 'Battle of Trafalgar', option_b: 'Battle of Borodino', option_c: 'Battle of Waterloo', option_d: 'Battle of Leipzig', correct_option: 'c', difficulty: 'medium' },
    { question_text: 'The Great Wall of China was primarily built to defend against whom?', option_a: 'Mongols', option_b: 'Japanese', option_c: 'Persians', option_d: 'Russians', correct_option: 'a', difficulty: 'medium' },
    { question_text: 'In which city was the Titanic built?', option_a: 'Glasgow', option_b: 'Liverpool', option_c: 'Belfast', option_d: 'Southampton', correct_option: 'c', difficulty: 'medium' },
    { question_text: 'What was the name of the first artificial satellite launched into space?', option_a: 'Explorer 1', option_b: 'Vostok', option_c: 'Sputnik 1', option_d: 'Luna 1', correct_option: 'c', difficulty: 'medium' },
    // HARD (5)
    { question_text: 'The Treaty of Westphalia (1648) ended which conflict?', option_a: 'The Hundred Years War', option_b: 'The Thirty Years War', option_c: 'The Crusades', option_d: 'The War of Spanish Succession', correct_option: 'b', difficulty: 'hard' },
    { question_text: 'Which civilization built Machu Picchu?', option_a: 'Aztec', option_b: 'Maya', option_c: 'Inca', option_d: 'Olmec', correct_option: 'c', difficulty: 'hard' },
    { question_text: 'Who was the Byzantine Emperor during the fall of Constantinople in 1453?', option_a: 'John VIII', option_b: 'Constantine XI', option_c: 'Alexios I', option_d: 'Manuel II', correct_option: 'b', difficulty: 'hard' },
    { question_text: 'The Scramble for Africa primarily occurred in which decade?', option_a: '1860s', option_b: '1870s', option_c: '1880s', option_d: '1850s', correct_option: 'c', difficulty: 'hard' },
    { question_text: 'Which US president signed the Emancipation Proclamation?', option_a: 'Ulysses Grant', option_b: 'Andrew Johnson', option_c: 'Abraham Lincoln', option_d: 'James Buchanan', correct_option: 'c', difficulty: 'hard' },
  ],

  // ── SPORTS (index 2) ──
  [
    // EASY (5)
    { question_text: 'How many players are on a standard soccer (football) team?', option_a: '9', option_b: '10', option_c: '11', option_d: '12', correct_option: 'c', difficulty: 'easy' },
    { question_text: 'In which sport would you perform a slam dunk?', option_a: 'Volleyball', option_b: 'Basketball', option_c: 'Tennis', option_d: 'Baseball', correct_option: 'b', difficulty: 'easy' },
    { question_text: 'The Olympic Games originated in which country?', option_a: 'Rome', option_b: 'Greece', option_c: 'Egypt', option_d: 'Persia', correct_option: 'b', difficulty: 'easy' },
    { question_text: 'How many holes are there in a standard round of golf?', option_a: '9', option_b: '12', option_c: '18', option_d: '21', correct_option: 'c', difficulty: 'easy' },
    { question_text: 'What sport is played at Wimbledon?', option_a: 'Cricket', option_b: 'Squash', option_c: 'Badminton', option_d: 'Tennis', correct_option: 'd', difficulty: 'easy' },
    // MEDIUM (10)
    { question_text: 'Which country has won the most FIFA World Cup titles?', option_a: 'Germany', option_b: 'Italy', option_c: 'Argentina', option_d: 'Brazil', correct_option: 'd', difficulty: 'medium' },
    { question_text: 'Who holds the record for the most Grand Slam tennis titles (men)?', option_a: 'Roger Federer', option_b: 'Rafael Nadal', option_c: 'Novak Djokovic', option_d: 'Pete Sampras', correct_option: 'c', difficulty: 'medium' },
    { question_text: 'In NFL, how many points is a touchdown worth?', option_a: '3', option_b: '7', option_c: '6', option_d: '4', correct_option: 'c', difficulty: 'medium' },
    { question_text: 'Which team has the most NBA Championships?', option_a: 'Chicago Bulls', option_b: 'Los Angeles Lakers', option_c: 'Boston Celtics', option_d: 'Golden State Warriors', correct_option: 'c', difficulty: 'medium' },
    { question_text: 'In which city were the 2016 Summer Olympics held?', option_a: 'London', option_b: 'Tokyo', option_c: 'Rio de Janeiro', option_d: 'Beijing', correct_option: 'c', difficulty: 'medium' },
    { question_text: 'What is the maximum score in a single game of bowling?', option_a: '200', option_b: '250', option_c: '300', option_d: '280', correct_option: 'c', difficulty: 'medium' },
    { question_text: 'The "Dream Team" representing the USA first competed in which Olympic year?', option_a: '1988', option_b: '1992', option_c: '1996', option_d: '2000', correct_option: 'b', difficulty: 'medium' },
    { question_text: 'Which boxer was known as "The Greatest"?', option_a: 'Mike Tyson', option_b: 'Joe Frazier', option_c: 'Muhammad Ali', option_d: 'Sugar Ray Leonard', correct_option: 'c', difficulty: 'medium' },
    { question_text: 'In cricket, how many balls are in a standard over?', option_a: '5', option_b: '6', option_c: '7', option_d: '8', correct_option: 'b', difficulty: 'medium' },
    { question_text: 'The Ryder Cup is a competition in which sport?', option_a: 'Tennis', option_b: 'Cricket', option_c: 'Golf', option_d: 'Polo', correct_option: 'c', difficulty: 'medium' },
    // HARD (5)
    { question_text: 'Who was the first player to score 100 points in a single NBA game?', option_a: 'Michael Jordan', option_b: 'Kareem Abdul-Jabbar', option_c: 'Wilt Chamberlain', option_d: 'Bill Russell', correct_option: 'c', difficulty: 'hard' },
    { question_text: 'In which year did Tiger Woods complete the "Tiger Slam" (holding all 4 majors simultaneously)?', option_a: '1999', option_b: '2000', option_c: '2001', option_d: '2002', correct_option: 'c', difficulty: 'hard' },
    { question_text: 'What is the name of the award given to the best player at each FIFA World Cup?', option_a: 'Golden Boot', option_b: 'Golden Glove', option_c: 'Golden Ball', option_d: 'Ballon d\'Or', correct_option: 'c', difficulty: 'hard' },
    { question_text: 'Who holds the world record for the 100m sprint?', option_a: 'Asafa Powell', option_b: 'Tyson Gay', option_c: 'Justin Gatlin', option_d: 'Usain Bolt', correct_option: 'd', difficulty: 'hard' },
    { question_text: 'In Formula 1, how many points does the race winner receive (since 2010)?', option_a: '12', option_b: '15', option_c: '25', option_d: '20', correct_option: 'c', difficulty: 'hard' },
  ],

  // ── TECHNOLOGY (index 3) ──
  [
    // EASY (5)
    { question_text: 'What does "CPU" stand for?', option_a: 'Central Processing Unit', option_b: 'Computer Processing Unit', option_c: 'Central Program Unit', option_d: 'Core Power Unit', correct_option: 'a', difficulty: 'easy' },
    { question_text: 'Which company created the iPhone?', option_a: 'Samsung', option_b: 'Google', option_c: 'Microsoft', option_d: 'Apple', correct_option: 'd', difficulty: 'easy' },
    { question_text: 'What does "HTTP" stand for?', option_a: 'HyperText Transfer Protocol', option_b: 'HyperText Transmission Process', option_c: 'High Transfer Text Protocol', option_d: 'Hyper Terminal Transfer Process', correct_option: 'a', difficulty: 'easy' },
    { question_text: 'What is the name of Google\'s mobile operating system?', option_a: 'iOS', option_b: 'Windows Mobile', option_c: 'Android', option_d: 'HarmonyOS', correct_option: 'c', difficulty: 'easy' },
    { question_text: 'What does "RAM" stand for?', option_a: 'Read Access Memory', option_b: 'Random Access Memory', option_c: 'Rapid Application Memory', option_d: 'Remote Access Module', correct_option: 'b', difficulty: 'easy' },
    // MEDIUM (10)
    { question_text: 'In which year was the World Wide Web invented?', option_a: '1983', option_b: '1989', option_c: '1994', option_d: '1991', correct_option: 'b', difficulty: 'medium' },
    { question_text: 'What programming language was created by Guido van Rossum?', option_a: 'Ruby', option_b: 'Java', option_c: 'Python', option_d: 'Perl', correct_option: 'c', difficulty: 'medium' },
    { question_text: 'What is the largest social media platform by monthly active users?', option_a: 'Instagram', option_b: 'TikTok', option_c: 'YouTube', option_d: 'Facebook', correct_option: 'd', difficulty: 'medium' },
    { question_text: 'What technology does Bluetooth primarily use?', option_a: 'Infrared', option_b: 'Radio waves', option_c: 'Sound waves', option_d: 'Ultraviolet light', correct_option: 'b', difficulty: 'medium' },
    { question_text: 'What does "SSD" stand for?', option_a: 'Super Speed Drive', option_b: 'Solid State Device', option_c: 'Solid State Drive', option_d: 'Storage Speed Disk', correct_option: 'c', difficulty: 'medium' },
    { question_text: 'What is the binary representation of the decimal number 10?', option_a: '1010', option_b: '1100', option_c: '0110', option_d: '1001', correct_option: 'a', difficulty: 'medium' },
    { question_text: 'Which company developed the Java programming language?', option_a: 'Microsoft', option_b: 'IBM', option_c: 'Apple', option_d: 'Sun Microsystems', correct_option: 'd', difficulty: 'medium' },
    { question_text: 'What does "VPN" stand for?', option_a: 'Virtual Private Network', option_b: 'Verified Personal Network', option_c: 'Virtual Protected Node', option_d: 'Verified Protected Network', correct_option: 'a', difficulty: 'medium' },
    { question_text: 'What is Git primarily used for?', option_a: 'Database management', option_b: 'Version control', option_c: 'Web hosting', option_d: 'Code compilation', correct_option: 'b', difficulty: 'medium' },
    { question_text: 'What does "API" stand for?', option_a: 'Application Program Interface', option_b: 'Automated Processing Integration', option_c: 'Application Programming Interface', option_d: 'Advanced Protocol Interface', correct_option: 'c', difficulty: 'medium' },
    // HARD (5)
    { question_text: 'In cryptography, what is a "zero-knowledge proof"?', option_a: 'A proof with no computational overhead', option_b: 'Proving knowledge of something without revealing it', option_c: 'An encryption with zero keys', option_d: 'A hash function with no collisions', correct_option: 'b', difficulty: 'hard' },
    { question_text: 'The CAP theorem in distributed systems states that a system cannot simultaneously guarantee more than two of which properties?', option_a: 'Consistency, Availability, and Partition tolerance', option_b: 'Concurrency, Atomicity, and Performance', option_c: 'Capacity, Accuracy, and Processing speed', option_d: 'Caching, Authentication, and Persistence', correct_option: 'a', difficulty: 'hard' },
    { question_text: 'What is Big O notation O(n log n) typically associated with?', option_a: 'Linear search', option_b: 'Binary search', option_c: 'Efficient sorting algorithms like Merge Sort', option_d: 'Bubble sort', correct_option: 'c', difficulty: 'hard' },
    { question_text: 'What is a "race condition" in concurrent programming?', option_a: 'A benchmarking test for CPU speed', option_b: 'A bug where output depends on non-deterministic timing of threads', option_c: 'A network latency issue', option_d: 'An overclocking failure', correct_option: 'b', difficulty: 'hard' },
    { question_text: 'What cryptographic algorithm does Bitcoin use for its proof-of-work?', option_a: 'MD5', option_b: 'AES-256', option_c: 'SHA-256', option_d: 'RSA-2048', correct_option: 'c', difficulty: 'hard' },
  ],

  // ── POP CULTURE (index 4) ──
  [
    // EASY (5)
    { question_text: 'Who sang "Shape of You" in 2017?', option_a: 'Justin Bieber', option_b: 'Ed Sheeran', option_c: 'Bruno Mars', option_d: 'Charlie Puth', correct_option: 'b', difficulty: 'easy' },
    { question_text: 'In "The Lion King", what is the name of Simba\'s father?', option_a: 'Scar', option_b: 'Rafiki', option_c: 'Mufasa', option_d: 'Pumba', correct_option: 'c', difficulty: 'easy' },
    { question_text: 'Which TV show features the fictional city of Hawkins, Indiana?', option_a: 'Dark', option_b: 'Stranger Things', option_c: 'The Haunting of Hill House', option_d: 'Twin Peaks', correct_option: 'b', difficulty: 'easy' },
    { question_text: 'What is the highest-grossing film franchise of all time?', option_a: 'Star Wars', option_b: 'Harry Potter', option_c: 'Marvel Cinematic Universe', option_d: 'James Bond', correct_option: 'c', difficulty: 'easy' },
    { question_text: 'Which artist is known as the "Queen of Pop"?', option_a: 'Beyoncé', option_b: 'Rihanna', option_c: 'Madonna', option_d: 'Lady Gaga', correct_option: 'c', difficulty: 'easy' },
    // MEDIUM (10)
    { question_text: 'Who played Iron Man in the Marvel Cinematic Universe?', option_a: 'Chris Evans', option_b: 'Robert Downey Jr.', option_c: 'Mark Ruffalo', option_d: 'Chris Hemsworth', correct_option: 'b', difficulty: 'medium' },
    { question_text: 'What streaming service produced "Squid Game"?', option_a: 'Hulu', option_b: 'Disney+', option_c: 'Amazon Prime', option_d: 'Netflix', correct_option: 'd', difficulty: 'medium' },
    { question_text: 'Which music artist has the most Grammy wins of all time?', option_a: 'Jay-Z', option_b: 'Beyoncé', option_c: 'Georg Solti', option_d: 'Alison Krauss', correct_option: 'b', difficulty: 'medium' },
    { question_text: 'In "Game of Thrones", who ultimately sits on the Iron Throne at the series end?', option_a: 'Nobody — it is destroyed', option_b: 'Jon Snow', option_c: 'Sansa Stark', option_d: 'Bran Stark', correct_option: 'd', difficulty: 'medium' },
    { question_text: 'Which 2019 film won the Academy Award for Best Picture?', option_a: '1917', option_b: 'Joker', option_c: 'Parasite', option_d: 'Once Upon a Time in Hollywood', correct_option: 'c', difficulty: 'medium' },
    { question_text: 'What is the name of the fictional town in "Schitt\'s Creek"?', option_a: 'Pawnee', option_b: 'Schitt\'s Creek', option_c: 'Letterkenny', option_d: 'Moose Creek', correct_option: 'b', difficulty: 'medium' },
    { question_text: 'What year did "Fortnite: Battle Royale" launch?', option_a: '2016', option_b: '2018', option_c: '2017', option_d: '2019', correct_option: 'c', difficulty: 'medium' },
    { question_text: 'Who directed the movie "Inception" (2010)?', option_a: 'Steven Spielberg', option_b: 'James Cameron', option_c: 'Christopher Nolan', option_d: 'Ridley Scott', correct_option: 'c', difficulty: 'medium' },
    { question_text: 'Which song was the best-selling single worldwide in 2019?', option_a: 'Senorita by Shawn Mendes', option_b: 'Old Town Road by Lil Nas X', option_c: 'Bad Guy by Billie Eilish', option_d: '7 Rings by Ariana Grande', correct_option: 'b', difficulty: 'medium' },
    { question_text: 'The TV series "Breaking Bad" is set in which US state?', option_a: 'Texas', option_b: 'Arizona', option_c: 'Nevada', option_d: 'New Mexico', correct_option: 'd', difficulty: 'medium' },
    // HARD (5)
    { question_text: 'In the film "Pulp Fiction", what is in the mysterious briefcase?', option_a: 'Diamonds', option_b: 'Gold bars', option_c: 'It is never revealed', option_d: 'A human soul', correct_option: 'c', difficulty: 'hard' },
    { question_text: 'What was the working title for the Beatles\' "Yesterday"?', option_a: 'Cloudy', option_b: 'Scrambled Eggs', option_c: 'Yesterday Morning', option_d: 'Sunday Dreaming', correct_option: 'b', difficulty: 'hard' },
    { question_text: 'Which director made both "Mulholland Drive" and "Twin Peaks"?', option_a: 'Tim Burton', option_b: 'Wes Anderson', option_c: 'David Lynch', option_d: 'Darren Aronofsky', correct_option: 'c', difficulty: 'hard' },
    { question_text: 'The Cannes Palme d\'Or in 2022 was awarded to which film?', option_a: 'Tár', option_b: 'Triangle of Sadness', option_c: 'Decision to Leave', option_d: 'The Northman', correct_option: 'b', difficulty: 'hard' },
    { question_text: 'Which album did Michael Jackson spend the most time producing?', option_a: 'Bad', option_b: 'Thriller', option_c: 'HIStory', option_d: 'Off the Wall', correct_option: 'b', difficulty: 'hard' },
  ],
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('⏳ Seeding database...');

    // ── Admin
    const adminHash = await bcrypt.hash('Admin@123456', 12);
    const adminRes = await client.query(`
      INSERT INTO admins (name, email, password_hash, role)
      VALUES ($1, $2, $3, 'super_admin')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, ['Super Admin', 'admin@thinktrophy.com', adminHash]);
    const adminId = adminRes.rows[0].id;
    console.log('  ✓ Admin seeded');

    // ── Platform settings
    const defaults = [
      ['min_stake',       '500.00'],
      ['max_stake',       '5000.00'],
      ['payout_perfect',  '2.0'],
      ['payout_nine',     '0.5'],
      ['game_duration',   '60'],
      ['platform_name',   'ThinkTrophy'],
      ['platform_tagline','Think Sharp. Win Big.'],
      ['referral_win_percentage', '0.10'],
      ['user_win_tax_percentage', '0.05'],
    ];
    for (const [key, value] of defaults) {
      await client.query(`
        INSERT INTO platform_settings (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO NOTHING
      `, [key, value]);
    }
    console.log('  ✓ Platform settings seeded');

    // ── Categories
    const catIds = [];
    for (const cat of categories) {
      const res = await client.query(`
        INSERT INTO categories (name, description, icon_name)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
        RETURNING id
      `, [cat.name, cat.description, cat.icon_name]);
      catIds.push(res.rows[0].id);
    }
    console.log('  ✓ Categories seeded');

    // ── Questions
    let qCount = 0;
    for (let i = 0; i < questionsByCat.length; i++) {
      const catId = catIds[i];
      for (const q of questionsByCat[i]) {
        await client.query(`
          INSERT INTO questions
            (category_id, question_text, option_a, option_b, option_c, option_d,
             correct_option, difficulty, created_by)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          ON CONFLICT DO NOTHING
        `, [catId, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
            q.correct_option, q.difficulty, adminId]);
        qCount++;
      }
    }
    console.log(`  ✓ ${qCount} questions seeded`);

    // ── Demo user
    const userHash = await bcrypt.hash('Player@123456', 12);
    await client.query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, phone_number, dob, wallet_balance, email_verified)
      VALUES ('demo_player', 'player@thinktrophy.com', $1, 'Demo', 'Player', '+1234567890', '1990-01-01', 100.00, TRUE)
      ON CONFLICT (email) DO NOTHING
    `, [userHash]);
    console.log('  ✓ Demo user seeded (player@thinktrophy.com / Player@123456)');

    // One row at a time, only if that exact quote is missing — so existing user-added rows
    // do not block the rest of the sample set (unlike INSERT-when-empty-only).
    const sampleTestimonials = [
      ['Chidi O.', 'Lagos', 'Finally a trivia app that pays out fast. I hit 10/10 twice last week — the rush is unreal.', 5, 0, true],
      ['Amaka K.', 'Abuja', 'Clean UI, fair questions, and withdrawals actually work. My go-to during lunch breaks.', 5, 1, true],
      ['Tunde M.', 'Port Harcourt', 'Love the variety of categories. History and Science are my favorites.', 4, 2, true],
      ['Ibrahim S.', 'Kano', 'The 60-second rounds keep me sharp. I have not missed my evening session in a month — leaderboard here I come.', 5, 3, true],
      ['Ngozi E.', 'Enugu', 'I started for the prizes and stayed for the questions. Tech and Literature categories are genuinely tough but fair.', 5, 4, true],
    ];
    let addedSamples = 0;
    for (const row of sampleTestimonials) {
      const ins = await client.query(
        `INSERT INTO testimonials (author_name, author_title, quote, rating, sort_order, is_active)
         SELECT $1, $2, $3, $4, $5, $6
         WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE quote = $3)`,
        row
      );
      if (ins.rowCount > 0) {
        addedSamples++;
        console.log(`  ✓ Added sample testimonial: ${row[0]}`);
      }
    }
    if (addedSamples === 0) {
      console.log('  · Sample testimonials: all quotes already present (skipped)');
    }

    await client.query('COMMIT');
    console.log('✅ Seeding complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
