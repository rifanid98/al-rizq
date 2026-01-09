
import { GoogleGenAI } from "@google/genai";
import { DailySchedule, PrayerName } from "../types";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const searchLocations = async (query: string): Promise<string[]> => {
  if (query.length < 3) return [];

  const prompt = `Cari 5 lokasi yang relevan untuk query: "${query}". 
  Format setiap lokasi harus mendetail: "Kecamatan, Kota/Kabupaten, Provinsi, Indonesia".
  Berikan hasil hanya dalam bentuk list string, satu baris untuk satu lokasi.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    return text.split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 5);
  } catch (error: any) {
    console.error("Search Location Error:", error);
    throw error;
  }
};

export const fetchPrayerTimes = async (location: { lat: number; lng: number } | { address: string }): Promise<DailySchedule> => {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  let locationQuery = 'address' in location ? location.address : `${location.lat}, ${location.lng}`;

  const prompt = `Search for the "Islamic prayer times" for ${locationQuery} on ${today} exactly as shown on Google Search.
  I need the 24-hour format times for: Subuh (Fajr), Dzuhur (Dhuhr), Ashar (Asr), Maghrib, and Isya (Isha).
  
  Format your response as:
  Location Name: [Full Address Found]
  Subuh: HH:mm
  Dzuhur: HH:mm
  Ashar: HH:mm
  Maghrib: HH:mm
  Isya: HH:mm
  
  Use Google Search to ensure these match current local times. Provide ONLY this list.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const sources: { title: string; uri: string }[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }
    
    const prayerNamesMapping: Record<string, PrayerName> = {
      'subuh': 'Subuh', 'fajr': 'Subuh',
      'dzuhur': 'Dzuhur', 'dhuhr': 'Dzuhur', 'zuhur': 'Dzuhur',
      'ashar': 'Ashar', 'asr': 'Ashar',
      'maghrib': 'Maghrib',
      'isya': 'Isya', 'isha': 'Isya'
    };

    const prayersFoundMap: Map<PrayerName, string> = new Map();
    const timeRegex = /(\d{1,2}[:.]\d{2})/g;

    text.split('\n').forEach(line => {
      const lowerLine = line.toLowerCase();
      const times = line.match(timeRegex);
      if (times) {
        for (const [key, val] of Object.entries(prayerNamesMapping)) {
          if (lowerLine.includes(key) && !prayersFoundMap.has(val)) {
            prayersFoundMap.set(val, times[0].replace('.', ':').padStart(5, '0'));
          }
        }
      }
    });

    let detectedLocation = 'address' in location ? location.address : 'Lokasi Terdeteksi';
    const locLine = text.split('\n').find(l => l.toLowerCase().includes('location'));
    if (locLine) detectedLocation = locLine.split(':')[1]?.trim() || detectedLocation;

    const order: PrayerName[] = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
    const finalPrayers = order.map(name => ({
      name,
      time: prayersFoundMap.get(name) || '00:00'
    }));

    if (finalPrayers.some(p => p.time === '00:00')) throw new Error("Gagal mengambil data waktu sholat yang lengkap.");

    return {
      date: new Date().toISOString().split('T')[0],
      location: detectedLocation,
      prayers: finalPrayers,
      sources: sources.length > 0 ? sources : undefined
    };
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
