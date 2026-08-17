export interface CuratedGif {
  id: string;
  title: string;
  category: string;
  url: string;
  tags: string[];
}

export const GIF_CATEGORIES = [
  'All',
  'Popcorn & Drama',
  'Laughing & Sarcasm',
  'Masterpiece & Applause',
  'Facepalm & Why',
  'Trash & Roasts',
  'Mind Blown & Hype',
  'Sleep & Boring',
];

export const CURATED_GIFS: CuratedGif[] = [
  // Popcorn & Drama
  {
    id: 'popcorn-mj',
    title: 'Michael Jackson Eating Popcorn',
    category: 'Popcorn & Drama',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdW4yNWJhcGlmZW16aDRtZDJpNmE2ZWltcThkbmJkYnQ2eXVreXZtZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/gl0mkIZOW6Nwc/giphy.gif',
    tags: ['popcorn', 'drama', 'eating', 'watching', 'cinema', 'mj'],
  },
  {
    id: 'popcorn-colbert',
    title: 'Colbert 3D Glasses Popcorn',
    category: 'Popcorn & Drama',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2ZicWZwb2h5MmszaWZsdTFsNWpka2NxeTZzNjVrcGpramR4a2ZqaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/tyqcJoNjNv0Fq/giphy.gif',
    tags: ['popcorn', '3d', 'colbert', 'drama', 'excited', 'ready'],
  },
  {
    id: 'kermit-tea',
    title: 'Kermit Sipping Tea',
    category: 'Popcorn & Drama',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOGx5YTYxaW91YTFhNmR3eDkxY2Z0cGZocnNmbXRidTRocmt4aDJlNiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Nw8z2olm0nGHC/giphy.gif',
    tags: ['tea', 'drama', 'kermit', 'shade', 'none of my business', 'petty'],
  },
  {
    id: 'dramatic-gasp',
    title: 'Dramatic Chipmunk Gasp',
    category: 'Popcorn & Drama',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZDV4NG9tZjE1d3Z4eWpmaTNrNnM1ZndldnB6NG8xd2w0NWhqNGhkNyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/kKdgdeuO2M08M/giphy.gif',
    tags: ['gasp', 'shock', 'drama', 'plot twist', 'omg', 'chipmunk'],
  },

  // Laughing & Sarcasm
  {
    id: 'leo-django-laugh',
    title: 'Leonardo DiCaprio Laughing Wine',
    category: 'Laughing & Sarcasm',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3J1bmYwOGpsbXB0Y3h5OGZtbG4zbW53dTh2bWp0NW91ZjZodmxvbyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o72F8t9TDi2xVnxOE/giphy.gif',
    tags: ['laugh', 'leo', 'dicaprio', 'wine', 'django', 'funny', 'smug'],
  },
  {
    id: 'elmo-fire',
    title: 'Elmo in Flames Chaos',
    category: 'Laughing & Sarcasm',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOTV5MHY5NDBiaWV5dnJvMW8xY3lvdzVkaWFmbmZod2ZtcjRsbjhucyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/yr7n0u3qzO9nG/giphy.gif',
    tags: ['fire', 'chaos', 'elmo', 'flames', 'disaster', 'hell', 'sucks'],
  },
  {
    id: 'carell-laugh-crying',
    title: 'Steve Carell Hysterical Laugh',
    category: 'Laughing & Sarcasm',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWNwaHNvbnRreWdld2tzdWx1eTBybzZ0eHB0MXk2amVmd2pnZHFjMyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/10JhviFuU2gWD6/giphy.gif',
    tags: ['laugh', 'lol', 'carell', 'office', 'crying', 'hysterical', 'rofl'],
  },
  {
    id: 'tom-cruise-laugh',
    title: 'Tom Cruise Crazy Laugh',
    category: 'Laughing & Sarcasm',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaG9jMzNlYm82MXA5dHh1MXhjcXZ4cWdhOHFubnhjczg5YXR3cTllMyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/vWDrezW0rMjmM/giphy.gif',
    tags: ['tom cruise', 'laugh', 'crazy', 'unhinged', 'cinema'],
  },

  // Masterpiece & Applause
  {
    id: 'citizen-kane-clap',
    title: 'Citizen Kane Standing Ovation',
    category: 'Masterpiece & Applause',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2R4bWtkdHFlbmYxNmFudTZxbHV6c2g3a3U3aHNtdjNreXh2MnlnbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/g9582DNuQppxC/giphy.gif',
    tags: ['clap', 'applause', 'bravo', 'masterpiece', 'cinema', 'gatsby', 'toast'],
  },
  {
    id: 'shia-clap',
    title: 'Shia LaBeouf Intense Clapping',
    category: 'Masterpiece & Applause',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWZvaG5ndGtkNGZ4eG90N2hkcmkyMHZzNGw5Z2phOHlndDVmYXlkdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/7rj2ZgBlAqgms/giphy.gif',
    tags: ['clap', 'applause', 'shia', 'intense', '10/10', 'standing ovation'],
  },
  {
    id: 'scorsese-cinema',
    title: 'Martin Scorsese Absolute Cinema',
    category: 'Masterpiece & Applause',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnAzaG9jNm5xZWhlaHlycWdxb3pkaWR2M2h4c3A1dDRhbnA5czV3YSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/TFIoWBxZwg2ZWn7Q5s/giphy.gif',
    tags: ['cinema', 'scorsese', 'masterpiece', '5 stars', 'film', 'kino'],
  },
  {
    id: 'banderas-nod',
    title: 'Antonio Banderas Satisfied Nod',
    category: 'Masterpiece & Applause',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHYwN3l6cjl1cmRmbzJ4bmt1ZjFtdnVpMHg3ZWkxd2ZscmVxdDZoaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/10Jpr9KSaXLchW/giphy.gif',
    tags: ['nod', 'yes', 'satisfaction', 'banderas', 'approval', 'approved'],
  },

  // Facepalm & Why
  {
    id: 'picard-facepalm',
    title: 'Captain Picard Facepalm',
    category: 'Facepalm & Why',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWNxdWNsaXlqOHoxcTVjN3hpaXR5MjhscTR3ZzI2NDdqYmppNGp5dyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/XsUtdIe80a1H2/giphy.gif',
    tags: ['facepalm', 'star trek', 'picard', 'disaster', 'smh', 'why'],
  },
  {
    id: 'ryan-reynolds-why',
    title: 'Ryan Reynolds But Why',
    category: 'Facepalm & Why',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmNyMmd1c2N5b2ZnbmV4ZzdsYjF4Y3E1ZmdyazR4d3N1cGN3aGN5OCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/1M9fmo1WAFVK0/giphy.gif',
    tags: ['why', 'ryan reynolds', 'confused', 'question', 'horrible'],
  },
  {
    id: 'rdj-eyeroll',
    title: 'Robert Downey Jr Eye Roll',
    category: 'Facepalm & Why',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmZ1NXpjc3pnMWVra21pazJ2d2I0aWVicmtidmpyNDN4dXQ5d2V5OCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/qmfpjpAT2fJRK/giphy.gif',
    tags: ['eyeroll', 'rdj', 'annoyed', 'iron man', 'whatever', 'bored'],
  },
  {
    id: 'nick-young-confused',
    title: 'Confused Nick Young ???',
    category: 'Facepalm & Why',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNTcxZnYwcjI5OGZlbjhhcWx4bDVva2sxdnh1bnA2YmduM2MzbG5heCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/lkdH8FmImcGoykg9Tv/giphy.gif',
    tags: ['confused', 'what', 'question', 'wtf', 'huh', 'nick young'],
  },

  // Trash & Roasts
  {
    id: 'ramsay-raw',
    title: 'Gordon Ramsay Disgusted',
    category: 'Trash & Roasts',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZm55aGJ0azgybW00dHF2NXZkOWlhNnZ6NGMxeTVuM2NqZ2M3am4wNyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/MnpPCugwALAHsTygpd/giphy.gif',
    tags: ['ramsay', 'trash', 'terrible', 'awful', 'sucks', 'disgusted', '0 stars'],
  },
  {
    id: 'gladiator-thumbs-down',
    title: 'Commodus Thumbs Down',
    category: 'Trash & Roasts',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmtpZnlzb2pkMWxqdXh2N3l5YnQ4d3JkZzV0Z3V6anl1aTFkMjV5dCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/iSxPmDWr97248/giphy.gif',
    tags: ['boo', 'thumbs down', 'gladiator', 'dislike', 'trash', 'garbage'],
  },
  {
    id: 'trash-can-fire',
    title: 'Dumpster Fire Burning',
    category: 'Trash & Roasts',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNXdzZ2J0cXZ0OWg3eHVhNnUwb2I2ZXNscmV5OHgxc2kxcHpsMmdpdSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/853jNve3ljllu/giphy.gif',
    tags: ['dumpster fire', 'trash', 'garbage', 'worst movie', 'sucks', 'terrible'],
  },
  {
    id: 'walk-out',
    title: 'Grandpa Simpson Turning Around',
    category: 'Trash & Roasts',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcm5kODZsaWw0ajVlNmtyZHA5YWRlczVycHVzcHhzMGpjcTRuNnMzbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/fDO2Nk0ImzvvW/giphy.gif',
    tags: ['simpsons', 'walk out', 'nope', 'leaving', 'turning around', 'bye'],
  },

  // Mind Blown & Hype
  {
    id: 'mind-blown-galaxy',
    title: 'Mind Blown Exploding Head',
    category: 'Mind Blown & Hype',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXl2b3JtdzltM2NxdXB3M2g5cXphNXpqN3h2bW9ndjJ4M2M2Ymw3diZlcD12MV9naWZzX3NlYXJjaCZjdD1n/26ufdipQqU2lhNA4g/giphy.gif',
    tags: ['mind blown', 'explosion', 'galaxy', 'insane', 'plot twist', 'hype'],
  },
  {
    id: 'jonah-hill-hype',
    title: 'Jonah Hill Screaming Excited',
    category: 'Mind Blown & Hype',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTVoa2NqOHk2eG42aWRudHFmNXVxbGZ1bXpnazM5dXNpdnppZWZyeiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5GoVLqeAOo6PK/giphy.gif',
    tags: ['jonah hill', 'excited', 'hype', 'screaming', 'yes', 'omg'],
  },
  {
    id: 'pedro-pascal-laugh-cry',
    title: 'Pedro Pascal Laughing to Crying',
    category: 'Mind Blown & Hype',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Yyb21ydWpqZ2lsN3ptNXc0OW5yNXQxaWhkMWtncG02NWFyZzFobCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/d7rvF20BtQD3G/giphy.gif',
    tags: ['pedro pascal', 'emotional', 'laugh cry', 'trauma', 'cinema', 'acting'],
  },

  // Sleep & Boring
  {
    id: 'spongebob-sleep',
    title: 'SpongeBob Sound Asleep',
    category: 'Sleep & Boring',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTVlOW1mNmd1Nm1yNXJ4aWtkNHp3cWtncm5vbjhpa3Z0dnl1anlkbyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mkhMTALSJYJWg/giphy.gif',
    tags: ['sleep', 'boring', 'spongebob', 'snore', 'snooze', 'fell asleep'],
  },
  {
    id: 'mr-bean-sleepy',
    title: 'Mr. Bean Struggling to Stay Awake',
    category: 'Sleep & Boring',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2Rya3V1MHA4NXk0NDFqODh3aXZtYzFsaXZlMGhpdHBlMzdpdjkyNyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mF4pM0y16e2pq/giphy.gif',
    tags: ['mr bean', 'sleepy', 'bored', 'yawn', 'tired', '3 hour runtime'],
  },
  {
    id: 'homer-bushes',
    title: 'Homer Backing into Bushes',
    category: 'Sleep & Boring',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaGcxNGQxa2pmaXVwaG1ndG9ia29tOTBnaXRhNWR0M2gzaWNuODg1NCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/COYGe9rZvfiaQ/giphy.gif',
    tags: ['homer', 'bushes', 'disappear', 'awkward', 'quiet', 'vanish'],
  },
];
