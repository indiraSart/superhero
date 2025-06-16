require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const Superhero = require('../models/Superhero');

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
  console.log('Starting to import superheroes...');
  const totalHeroes = 30; // We'll try to fetch 30 to ensure we get at least 20 valid ones
  const heroes = [];

  for (let i = 1; i <= totalHeroes; i++) {
    const hero = await fetchHero(i);
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
      console.log(`Fetched hero ${i}: ${hero.name}`);
    } else {
      console.log(`Skipping hero ${i}: Invalid data`);
    }
  }

  // Save heroes to database
  try {
    await Superhero.deleteMany({}); // Clear existing data
    await Superhero.insertMany(heroes);
    console.log(`Successfully imported ${heroes.length} superheroes!`);
  } catch (error) {
    console.error('Error saving heroes to database:', error);
  }

  mongoose.disconnect();
};

importHeroes();
