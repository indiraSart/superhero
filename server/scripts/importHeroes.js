require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const Superhero = require('../models/superhero'); 

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/superhero', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const token = process.env.SUPERHERO_API_TOKEN;
if (!token) {
  console.error('No Superhero API token found. Please add it to your .env file.');
  process.exit(1);
}

const famousHeroIds = [
  // DC Comics
  70,   // Batman
  644,  // Superman
  720,  // Wonder Woman
  263,  // Flash
  30,   // Aquaman
  298,  // Green Lantern
  561,  // Shazam
  309,  // Harley Quinn
  370,  // Joker
  405,  // Lex Luthor
  
  // Marvel
  332,  // Iron Man
  149,  // Captain America
  659,  // Thor
  620,  // Spider-Man
  313,  // Hulk
  107,  // Black Widow
  106,  // Black Panther
  717,  // Wolverine
  157,  // Captain Marvel
  226,  // Doctor Strange
  165,  // Deadpool
  303,  // Groot
  303,  // Thanos
  579,  // Silver Surfer
  638,  // Storm
  
  // Additional popular heroes
  213,  // Daredevil
  423,  // Magneto
  566,  // Rogue
  541,  // Professor X
  275,  // Ghost Rider
  687,  // Vision
  598,  // Superman Prime
  655,  // Thanos
  729,  // X-Man
  732   // Zatanna
];

const fetchHero = async (id) => {
  try {
    const response = await axios.get(`https://superheroapi.com/api/${token}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch hero with ID ${id}:`, error.message);
    return null;
  }
};

const importHeroes = async () => {
  console.log('Starting to import famous superheroes...');
  const heroes = [];

  for (const id of famousHeroIds) {
    if (heroes.length >= 30) break; 
    
    const hero = await fetchHero(id);
    if (hero && hero.response === 'success') {
      const formattedHero = {
        id: hero.id,
        name: hero.name,
        powerstats: {
          intelligence: parseInt(hero.powerstats.intelligence) || 0,
          strength: parseInt(hero.powerstats.strength) || 0,
          speed: parseInt(hero.powerstats.speed) || 0,
          durability: parseInt(hero.powerstats.durability) || 0,
          power: parseInt(hero.powerstats.power) || 0,
          combat: parseInt(hero.powerstats.combat) || 0
        },
        biography: {
          fullName: hero.biography['full-name'],
          alterEgos: hero.biography['alter-egos'],
          aliases: hero.biography.aliases,
          placeOfBirth: hero.biography['place-of-birth'],
          firstAppearance: hero.biography['first-appearance'],
          publisher: hero.biography.publisher,
          alignment: hero.biography.alignment
        },
        appearance: {
          gender: hero.appearance.gender,
          race: hero.appearance.race,
          height: hero.appearance.height,
          weight: hero.appearance.weight,
          eyeColor: hero.appearance['eye-color'],
          hairColor: hero.appearance['hair-color']
        },
        work: {
          occupation: hero.work.occupation,
          base: hero.work.base
        },
        connections: {
          groupAffiliation: hero.connections['group-affiliation'],
          relatives: hero.connections.relatives
        },
        image: {
          url: hero.image.url
        }
      };
      heroes.push(formattedHero);
      console.log(`Fetched famous hero: ${hero.name} (${heroes.length} of 30)`);
    } else {
      console.log(`Skipping hero with ID ${id}: Invalid data`);
    }
  }

  // Save heroes to database
  try {
    await Superhero.deleteMany({}); 
    await Superhero.insertMany(heroes);
    console.log(`Successfully imported ${heroes.length} famous superheroes!`);
  } catch (error) {
    console.error('Error saving heroes to database:', error);
  }

  mongoose.disconnect();
};

importHeroes();
